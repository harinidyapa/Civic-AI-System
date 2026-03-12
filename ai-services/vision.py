import os
import io
import base64
import numpy as np
from PIL import Image
from ultralytics import YOLO
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Load YOLO model
yolo_model = YOLO('yolov8n.pt')

# Valid civic categories
CIVIC_CATEGORIES = ["Pothole", "Garbage", "Streetlight", "Water Leakage", "Uncategorized"]

# YOLO COCO class → civic category mapping
YOLO_TO_CATEGORY = {
    9:  "Streetlight",   # traffic light (closest to streetlight)
    39: "Water Leakage", # bottle (proxy — not perfect)
    # Most COCO classes aren't civic issues, so we rely on Gemini for the rest
}


def classify_image(image_bytes):
    """
    Two-stage classification:
    1. YOLO — fast local detection for known civic objects
    2. Gemini Vision — smart fallback that actually understands civic context

    Returns: (category, confidence)
    """
    image = Image.open(io.BytesIO(image_bytes))

    # ── Stage 1: YOLO ──────────────────────────────
    try:
        results = yolo_model(image)
        if results and len(results) > 0:
            result = results[0]
            if result.boxes and len(result.boxes) > 0:
                boxes = result.boxes
                max_conf_idx = int(np.argmax(boxes.conf.cpu().numpy()))
                class_id = int(boxes.cls[max_conf_idx].cpu().numpy())
                confidence = float(boxes.conf[max_conf_idx].cpu().numpy())

                category = YOLO_TO_CATEGORY.get(class_id)
                if category:
                    print(f"YOLO detected: {category} ({confidence:.2f})")
                    return category, confidence
    except Exception as e:
        print(f"YOLO error: {e}")

    # ── Stage 2: Gemini Vision fallback ────────────
    print("YOLO didn't find a civic issue — using Gemini Vision...")
    return _classify_with_gemini(image_bytes)


def _classify_with_gemini(image_bytes):
    """
    Uses Gemini's vision capability to identify civic issues in images.
    Much smarter than YOLO for potholes, garbage, water leakage etc.
    """
    try:
        # Convert to PIL for Gemini
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed (handles PNG with alpha etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")

        prompt = """You are a smart city issue detection system.
Look at this image and identify if it contains any of these civic issues:
- Pothole (damaged road, cracks, holes in road surface)
- Garbage (trash, waste, litter, dump, garbage pile)
- Streetlight (broken lamp, dark street light, damaged pole)
- Water Leakage (flooding, water pipe leak, puddle from pipe, sewage overflow)
- Uncategorized (if none of the above are clearly visible)

Reply in this EXACT format only:
CATEGORY: <one of the 5 categories above>
CONFIDENCE: <number between 0 and 1>
REASON: <one short sentence>

Nothing else."""

        response = gemini_model.generate_content([prompt, image])
        result = response.text.strip()
        print(f"Gemini Vision response:\n{result}")

        category = "Uncategorized"
        confidence = 0.5

        for line in result.split("\n"):
            line = line.strip()
            if line.startswith("CATEGORY:"):
                cat = line.replace("CATEGORY:", "").strip()
                if cat in CIVIC_CATEGORIES:
                    category = cat
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except ValueError:
                    confidence = 0.5

        return category, round(confidence, 4)

    except Exception as e:
        print(f"Gemini Vision error: {e}")
        return "Uncategorized", 0.0