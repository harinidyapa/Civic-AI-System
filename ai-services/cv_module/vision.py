import os
import io
import sys
import base64
import numpy as np
from PIL import Image
from ultralytics import YOLO
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Valid civic categories
CIVIC_CATEGORIES = ["Pothole", "Garbage", "Streetlight", "Water Leakage", "Uncategorized"]

# YOLO COCO class → civic category mapping
YOLO_TO_CATEGORY = {
    9:  "Streetlight",
    39: "Water Leakage",
}

# Ensure API Key exists
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠️  WARNING: GEMINI_API_KEY / GOOGLE_API_KEY not set in environment variables!", file=sys.stderr)
    print("   Image classification will fail unless this is set.", file=sys.stderr)

try:
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")
    print("✅ Gemini API configured successfully")
except Exception as e:
    print(f"❌ Failed to configure Gemini: {e}", file=sys.stderr)
    gemini_model = None

# Load YOLO model
yolo_model_path = 'yolov8n.pt'
try:
    yolo_model = YOLO(yolo_model_path)
    print(f"✅ YOLO model loaded: {yolo_model_path}")
except Exception as e:
    print(f"❌ Failed to load YOLO model: {e}", file=sys.stderr)
    yolo_model = None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN CLASSIFICATION FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def classify_image(image_bytes):
    """
    Two-stage classification:
    1. YOLO  — fast local detection
    2. Gemini Vision — smart fallback
    Returns: (category, confidence) where category is one of CIVIC_CATEGORIES
    """
    if not image_bytes:
        print("❌ No image data provided")
        return "Uncategorized", 0.0
    
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        print(f"📷 Image loaded: {image.size} {image.mode}")
    except Exception as e:
        print(f"❌ Failed to load image: {e}")
        return "Uncategorized", 0.0

    # ── Stage 1: YOLO ──
    category, confidence = _classify_with_yolo(image)
    if category != "Uncategorized":
        return category, confidence

    # ── Stage 2: Gemini Vision ──
    print("🔄 YOLO didn't find a civic issue → Using Gemini Vision fallback...")
    return _classify_with_gemini(image_bytes)


def _classify_with_yolo(image):
    """
    Stage 1: Fast object detection using YOLO
    Returns: (category, confidence) or ("Uncategorized", 0.0) if no civic object found
    """
    if not yolo_model:
        print("⚠️  YOLO model not available, skipping YOLO stage")
        return "Uncategorized", 0.0
    
    try:
        print("🔍 Running YOLO detection...")
        results = yolo_model(image, verbose=False)
        
        if not results or len(results) == 0:
            print("  → No YOLO results")
            return "Uncategorized", 0.0
        
        result = results[0]
        
        if not result.boxes or len(result.boxes) == 0:
            print("  → No boxes detected")
            return "Uncategorized", 0.0
        
        boxes = result.boxes
        max_conf_idx = int(np.argmax(boxes.conf.cpu().numpy()))
        class_id = int(boxes.cls[max_conf_idx].cpu().numpy())
        confidence = float(boxes.conf[max_conf_idx].cpu().numpy())
        
        category = YOLO_TO_CATEGORY.get(class_id)
        if category:
            print(f"✅ YOLO detected: {category} (confidence: {confidence:.2%})")
            return category, confidence
        else:
            print(f"  → YOLO found class {class_id} but not mapped to civic category")
            return "Uncategorized", 0.0
            
    except Exception as e:
        print(f"⚠️  YOLO error: {e}")
        return "Uncategorized", 0.0


def _classify_with_gemini(image_bytes):
    """
    Stage 2: Smart image classification using Gemini Vision
    Used as fallback when YOLO doesn't detect a civic object
    Returns: (category, confidence) where category is one of CIVIC_CATEGORIES
    """
    if not gemini_model:
        print("❌ Gemini model not available")
        return "Uncategorized", 0.0
    
    try:
        # Convert bytes to PIL Image and then to JPEG
        print("  Converting image for Gemini...")
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Save as JPEG (Gemini API handles JPEG best)
        jpeg_buffer = io.BytesIO()
        image.save(jpeg_buffer, format="JPEG", quality=85)
        jpeg_bytes = jpeg_buffer.getvalue()
        print(f"  JPEG prepared: {len(jpeg_bytes)} bytes")

        # Encode as base64 for Gemini API
        image_base64 = base64.standard_b64encode(jpeg_bytes).decode("utf-8")
        print(f"  Base64 encoded: {len(image_base64)} characters")

        # Carefully crafted prompt for civic issue detection
        prompt = """You are an expert urban infrastructure inspector. Analyze this image and identify the specific civic infrastructure issue present.

IMPORTANT: You must identify exactly ONE of these 5 categories:
1. Pothole - Road/pavement damage including cracks, holes, broken asphalt, potholes
2. Garbage - Litter, trash, waste piles, debris, dumped materials
3. Streetlight - Broken streetlights, damaged lamp posts, non-functional lights
4. Water Leakage - Flooding, water pipe leaks, puddles from pipes, sewage overflow
5. Uncategorized - No clear civic infrastructure issue visible, or unclear

YOU MUST RESPOND IN EXACTLY THIS FORMAT (nothing extra):
CATEGORY: [one of the 5 categories above]
CONFIDENCE: [a number between 0.0 and 1.0]
REASON: [one short sentence explaining your choice]"""

        # Call Gemini Vision API with the image
        print("  🔄 Calling Gemini API...")
        response = gemini_model.generate_content(
            [
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": image_base64,
                }
            ]
        )
        
        result = response.text.strip()
        print(f"✅ Gemini responded:\n{result}\n")

        # Initialize with defaults
        category = "Uncategorized"
        confidence = 0.0

        # Parse response carefully
        lines = result.split("\n")
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Extract category
            if line.startswith("CATEGORY:"):
                cat_text = line.replace("CATEGORY:", "").strip()
                cat_text = cat_text.strip("[] ")
                
                # Try exact match first (case-insensitive)
                for valid_cat in CIVIC_CATEGORIES:
                    if valid_cat.lower() == cat_text.lower():
                        category = valid_cat
                        print(f"  ✅ Exact match: {category}")
                        break
                
                # If still uncategorized, try partial match
                if category == "Uncategorized":
                    for valid_cat in CIVIC_CATEGORIES[:-1]:  # Exclude Uncategorized from partial matching
                        if valid_cat.lower() in cat_text.lower():
                            category = valid_cat
                            print(f"  ✅ Partial match: {category}")
                            break
                else:
                    if category != "Uncategorized":
                        print(f"  ✅ Category extracted: {category}")
                            
            # Extract confidence
            elif line.startswith("CONFIDENCE:"):
                conf_text = line.replace("CONFIDENCE:", "").strip().strip("[] ")
                try:
                    # Handle multiple confidence formats
                    if "%" in conf_text:
                        # "85%" format
                        confidence = float(conf_text.replace("%", "").strip()) / 100.0
                    else:
                        # "0.85" format
                        confidence = float(conf_text)
                    
                    # Clamp to [0, 1]
                    confidence = min(1.0, max(0.0, confidence))
                    print(f"  ✅ Confidence extracted: {confidence:.2%}")
                    
                except (ValueError, AttributeError) as e:
                    print(f"  ⚠️  Could not parse confidence '{conf_text}': {e}")
                    confidence = 0.0

        # Validate result
        if category not in CIVIC_CATEGORIES:
            print(f"  ⚠️  Category '{category}' not valid, using 'Uncategorized'")
            category = "Uncategorized"
            confidence = 0.0

        print(f"\n✅ FINAL RESULT: {category} ({confidence:.2%} confidence)")
        return category, round(confidence, 4)

    except Exception as e:
        print(f"❌ Gemini Vision error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return "Uncategorized", 0.0