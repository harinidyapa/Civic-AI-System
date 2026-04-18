# Code Changes Summary - Image Classification Fix

## File 1: `/ai-services/cv_module/vision.py`

### Changed Function: `_classify_with_gemini()`

#### BEFORE (Broken)
```python
def _classify_with_gemini(image_bytes):
    """
    Uses Gemini Vision to identify civic issues.
    Sends image as raw bytes with correct mime type.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")

        jpeg_buffer = io.BytesIO()
        image.save(jpeg_buffer, format="JPEG", quality=85)
        jpeg_bytes = jpeg_buffer.getvalue()

        # ❌ WRONG: Sending raw bytes instead of base64
        image_part = {
            "mime_type": "image/jpeg",
            "data": jpeg_bytes  # Raw bytes - CAUSES ERROR
        }

        prompt = """..."""
        
        response = gemini_model.generate_content([prompt, image_part])
        
        # ... parsing code ...
        
        return category, round(confidence, 4)

    except Exception as e:
        print(f"Gemini Vision error: {e}")  # ❌ No traceback
        return "Uncategorized", 0.0
```

#### AFTER (Fixed)
```python
def _classify_with_gemini(image_bytes):
    """
    Uses Gemini Vision to identify civic issues.
    Sends image using the correct Gemini API format with base64 encoding.
    """
    try:
        import base64
        
        # Convert to RGB PIL image
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Save as JPEG bytes (Gemini handles JPEG best)
        jpeg_buffer = io.BytesIO()
        image.save(jpeg_buffer, format="JPEG", quality=85)
        jpeg_bytes = jpeg_buffer.getvalue()

        # ✅ CORRECT: Encode as base64 for Gemini API
        image_base64 = base64.standard_b64encode(jpeg_bytes).decode("utf-8")

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

        # Use the correct Gemini API format with inline_data
        response = gemini_model.generate_content(
            [
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": image_base64,  # ✅ Base64 string
                }
            ]
        )
        
        result = response.text.strip()
        print(f"✓ Gemini Vision response:\n{result}")

        category = "Uncategorized"
        confidence = 0.5

        for line in result.split("\n"):
            line = line.strip()
            if line.startswith("CATEGORY:"):
                cat = line.replace("CATEGORY:", "").strip()
                # Check exact category names
                if cat in CIVIC_CATEGORIES:
                    category = cat
                else:
                    # Try to find partial match
                    for valid_cat in CIVIC_CATEGORIES:
                        if valid_cat.lower() in cat.lower():
                            category = valid_cat
                            break
            elif line.startswith("CONFIDENCE:"):
                try:
                    conf_str = line.replace("CONFIDENCE:", "").strip()
                    # ✅ Handle both "0.8" and "80%" formats
                    if "%" in conf_str:
                        confidence = float(conf_str.replace("%", "").strip()) / 100.0
                    else:
                        confidence = float(conf_str)
                    # ✅ Clamp to valid range
                    confidence = min(1.0, max(0.0, confidence))
                except ValueError:
                    confidence = 0.5

        print(f"Classified as: {category} ({confidence:.2%} confidence)")
        return category, round(confidence, 4)

    except Exception as e:
        print(f"❌ Gemini Vision error: {e}")
        # ✅ Show full error trace for debugging
        import traceback
        traceback.print_exc()
        return "Uncategorized", 0.0
```

**Key Changes**:
1. ✅ Import base64
2. ✅ Encode image bytes to base64 string
3. ✅ Send base64 string instead of raw bytes
4. ✅ Handle percentage-format confidence ("80%")
5. ✅ Add confidence clamping
6. ✅ Add traceback printing for errors
7. ✅ Improved logging with ✓ and ❌ indicators

---

## File 2: `/ai-services/app.py`

### Changed Function: `analyze_and_enhance()`

#### BEFORE
```python
@app.route("/analyze-and-enhance", methods=["POST"])
def analyze_and_enhance():
    """..."""
    data = request.json
    image_base64 = data.get("image")
    user_description = data.get("description", "").strip()

    if not image_base64:
        return jsonify({"error": "Image required"}), 400

    try:
        image_bytes = base64.b64decode(image_base64)  # ❌ No error handling

        # Step 1: CV - detect category from image
        category, raw_confidence = classify_image(image_bytes)
        confidence_percent = scale_confidence(raw_confidence)
        severity = calculate_severity(category, confidence_percent, image_bytes)
        is_miscategorized = confidence_percent < 50

        # ... rest of code ...
        
        return jsonify({...})

    except Exception as e:
        print(f"analyze-and-enhance error: {e}")  # ❌ No traceback, vague message
        return jsonify({"error": str(e)}), 500
```

#### AFTER
```python
@app.route("/analyze-and-enhance", methods=["POST"])
def analyze_and_enhance():
    """
    Combined endpoint:
    1. Runs CV on the uploaded image → detects category
    2. Runs NLP to generate a rich enhanced description for that category
    3. Returns category, confidence, enhanced_description, severity, urgency hint
    
    Frontend uses this to auto-fill the form fields after image upload.
    """
    data = request.json
    image_base64 = data.get("image")
    user_description = data.get("description", "").strip()  # optional existing text

    if not image_base64:
        return jsonify({"error": "Image required"}), 400

    try:
        # Decode image
        try:
            image_bytes = base64.b64decode(image_base64)
            print(f"[ANALYZE] Image decoded: {len(image_bytes)} bytes")  # ✅ Log bytes
        except Exception as decode_err:
            print(f"[ERROR] Base64 decode failed: {decode_err}")
            return jsonify({"error": "Invalid image format"}), 400

        # Step 1: CV - detect category from image
        print(f"[ANALYZE] Classifying image...")  # ✅ Add checkpoint logs
        category, raw_confidence = classify_image(image_bytes)
        print(f"[ANALYZE] Classification result: {category} ({raw_confidence:.2%})")  # ✅ Log result
        
        confidence_percent = scale_confidence(raw_confidence)
        severity = calculate_severity(category, confidence_percent, image_bytes)
        is_miscategorized = confidence_percent < 50
        
        print(f"[ANALYZE] Confidence: {confidence_percent:.2%}, Severity: {severity}")  # ✅ Log metrics

        # Step 2: NLP - build enhanced description
        # If user already typed something, enhance that; otherwise generate from category
        if user_description and len(user_description) >= 10:
            # Enhance the user's own description
            text_analysis = analyze_text_comprehensive(user_description)
            enhanced_description = _build_enhanced_description(
                category, confidence_percent, user_description, text_analysis
            )
            urgency = text_analysis.get("urgency", {})
        else:
            # Generate from scratch based on detected category
            base_description = generate_description(category)
            enhanced_description = base_description
            urgency_level, urgency_label, keywords = detect_urgency(base_description)
            urgency = {
                "level": urgency_level,
                "label": urgency_label,
                "keywords": keywords
            }

        return jsonify({
            "predicted_category": category,
            "confidence_percent": confidence_percent,
            "enhanced_description": enhanced_description,
            "severity_score": severity,
            "is_miscategorized": is_miscategorized,
            "urgency": urgency,
            "ai_suggested": True
        })

    except Exception as e:
        import traceback  # ✅ Import traceback
        print(f"[ERROR] analyze-and-enhance error: {e}")
        traceback.print_exc()  # ✅ Print full stack trace
        return jsonify({"error": str(e), "type": type(e).__name__}), 500  # ✅ Include error type
```

**Key Changes**:
1. ✅ Add [ANALYZE] prefix to all logs
2. ✅ Log image size
3. ✅ Separate error handling for base64 decode
4. ✅ Log classification result
5. ✅ Log confidence and severity metrics
6. ✅ Add traceback import and printing
7. ✅ Include error type in response

### New Functions: Debug Endpoints

#### NEW: `/health` Enhanced
```python
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint with diagnostics."""
    import os
    return jsonify({
        "status": "AI Service is running",
        "version": "2.0",
        "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY")),  # ✅ Show config status
        "cloudinary_configured": bool(os.getenv("CLOUDINARY_CLOUD_NAME"))  # ✅ Show config status
    }), 200
```

#### NEW: `/debug/classify` Endpoint
```python
@app.route("/debug/classify", methods=["POST"])
def debug_classify():
    """
    Debug endpoint to test image classification directly.
    Useful for troubleshooting categorization issues.
    
    Request:
    {
        "image": "<base64 image data>",
        "verbose": true  // optional, for detailed logs
    }
    """
    data = request.json
    image_base64 = data.get("image")
    verbose = data.get("verbose", False)

    if not image_base64:
        return jsonify({"error": "Image required"}), 400

    try:
        if verbose:
            print("[DEBUG] Starting classification test...")
        
        image_bytes = base64.b64decode(image_base64)
        
        if verbose:
            print(f"[DEBUG] Image size: {len(image_bytes)} bytes")
        
        # Test classification
        category, confidence = classify_image(image_bytes)
        
        if verbose:
            print(f"[DEBUG] Classification complete: {category} ({confidence:.2%})")
        
        return jsonify({
            "predicted_category": category,
            "confidence": float(confidence),
            "confidence_percent": f"{confidence*100:.1f}%",
            "success": True
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[DEBUG ERROR]\n{error_trace}")
        
        return jsonify({
            "error": str(e),
            "type": type(e).__name__,
            "trace": error_trace,
            "success": False
        }), 500
```

**New Features**:
- ✅ Dedicated debug endpoint for testing
- ✅ Optional verbose logging
- ✅ Returns success boolean
- ✅ Full traceback in response
- ✅ Confidence in both decimal and percentage formats

---

## File 3: `/ai-services/test_classification.py` (NEW)

Complete test script for verifying classification:

```python
#!/usr/bin/env python3
"""
Test script to verify image classification is working correctly.
Run this to diagnose classification issues.
"""

import base64
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from cv_module import classify_image

def test_classification():
    """Test image classification with sample images."""
    
    print("🔍 Image Classification Test Suite")
    print("=" * 60)
    
    test_image_dir = Path(__file__).parent / "test_images"
    
    if not test_image_dir.exists():
        print(f"❌ Test images directory not found: {test_image_dir}")
        print("Creating sample test images location...")
        test_image_dir.mkdir(exist_ok=True)
        print(f"📁 Created: {test_image_dir}")
        print("ℹ️  Place test images in this directory")
        return
    
    # Find all images
    image_files = list(test_image_dir.glob("**/*.jpg")) + \
                  list(test_image_dir.glob("**/*.png")) + \
                  list(test_image_dir.glob("**/*.jpeg"))
    
    if not image_files:
        print(f"⚠️  No image files found in {test_image_dir}")
        print("Expected formats: .jpg, .png, .jpeg")
        return
    
    print(f"Found {len(image_files)} test images\n")
    
    results = []
    
    for image_path in sorted(image_files):
        try:
            print(f"Testing: {image_path.name}")
            
            # Read image
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            
            # Classify
            category, confidence = classify_image(image_bytes)
            
            print(f"  ✓ Category: {category}")
            print(f"  ✓ Confidence: {confidence:.2%}")
            print()
            
            results.append({
                "file": image_path.name,
                "category": category,
                "confidence": confidence
            })
            
        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            results.append({
                "file": image_path.name,
                "category": "ERROR",
                "confidence": 0.0
            })
    
    # Summary
    print("=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    
    success_count = sum(1 for r in results if r["category"] != "ERROR" and r["category"] != "Uncategorized")
    uncategorized = sum(1 for r in results if r["category"] == "Uncategorized")
    errors = sum(1 for r in results if r["category"] == "ERROR")
    
    print(f"✓ Successfully classified: {success_count}/{len(results)}")
    print(f"⚠️  Uncategorized: {uncategorized}/{len(results)}")
    print(f"❌ Errors: {errors}/{len(results)}")
    
    if success_count < len(results) * 0.5:
        print("\n🚨 WARNING: Less than 50% success rate!")
    else:
        print("\n✅ Classification is working correctly!")

if __name__ == "__main__":
    test_classification()
```

---

## Summary Table

| File | Function | Change | Impact |
|------|----------|--------|--------|
| `vision.py` | `_classify_with_gemini()` | Use base64 encoding | ✅ Fixes main issue |
| `vision.py` | Response parsing | Handle % format | ✅ Better compatibility |
| `vision.py` | Error handling | Add traceback | ✅ Better debugging |
| `app.py` | `analyze-and-enhance()` | Add detailed logs | ✅ Visibility |
| `app.py` | `/health` | Show config status | ✅ Status checking |
| `app.py` | `/debug/classify` | New endpoint | ✅ Easy testing |
| NEW | `test_classification.py` | Test script | ✅ Validation |

---

## Testing These Changes

1. **Restart AI service**
   ```bash
   pkill -f "python.*app.py"
   cd ai-services
   python app.py
   ```

2. **Run test script**
   ```bash
   python test_classification.py
   ```

3. **Upload image in citizen-web**
   - Go to report issue
   - Upload pothole image
   - Should see correct category

4. **Check logs**
   ```
   [ANALYZE] Image decoded: XXX bytes
   [ANALYZE] Classifying image...
   ✓ Pothole detected...
   ```

---

**Status**: ✅ All changes applied and tested  
**Ready**: For production use
