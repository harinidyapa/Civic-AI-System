import os
import io
import numpy as np
from PIL import Image
from ultralytics import YOLO
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# Load YOLO model
yolo_model = YOLO('yolov8n.pt')

# Valid civic categories
CIVIC_CATEGORIES = ["Pothole", "Garbage", "Streetlight", "Water Leakage", "Uncategorized"]

# YOLO COCO class → civic category mapping
YOLO_TO_CATEGORY = {
    9:  "Streetlight",
    39: "Water Leakage",
}


def classify_image(image_bytes):
    """
    Two-stage classification:
    1. YOLO  — fast local detection
    2. Gemini Vision — smart fallback
    Returns: (category, confidence)
    """
    image = Image.open(io.BytesIO(image_bytes))

    # ── Stage 1: YOLO ──
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
                    print(f"✓ YOLO detected: {category} ({confidence:.2f})")
                    return category, confidence
    except Exception as e:
        print(f"YOLO error: {e}")

    # ── Stage 2: Gemini Vision ──
    print("YOLO didn't find a civic issue — using Gemini Vision...")
    return _classify_with_gemini(image_bytes)


def _classify_with_gemini(image_bytes):
    """
    Uses Gemini Vision to identify civic issues.
    Sends image as raw bytes with correct mime type.
    """
    try:
        # Convert to RGB PIL image
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Save as JPEG bytes (Gemini handles JPEG best)
        jpeg_buffer = io.BytesIO()
        image.save(jpeg_buffer, format="JPEG", quality=85)
        jpeg_bytes = jpeg_buffer.getvalue()

        # Send as inline image data — correct format for google-generativeai
        image_part = {
            "mime_type": "image/jpeg",
            "data": jpeg_bytes
        }

        prompt = """You are a smart city issue detection system.
Look at this image carefully and identify if it contains any of these civic issues:
- Pothole (damaged road, cracks, holes in road surface, broken asphalt)
- Garbage (trash, waste, litter, garbage pile, dumped waste)
- Streetlight (broken lamp post, dark street light, damaged pole)
- Water Leakage (flooding, water pipe leak, puddle from pipe, sewage overflow)
- Uncategorized (if none of the above are clearly visible)

Reply in this EXACT format only:
CATEGORY: <one of the 5 categories above>
CONFIDENCE: <number between 0 and 1>
REASON: <one short sentence>

Nothing else."""

        response = gemini_model.generate_content([prompt, image_part])
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