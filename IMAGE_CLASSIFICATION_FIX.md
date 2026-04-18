# Image Classification Fix - Complete Troubleshooting Guide

## Problem Summary
Images uploaded through citizen-web are now showing as "Uncategorized" instead of being correctly classified as Pothole, Garbage, Streetlight, etc.

## Root Causes & Fixes Applied

### Issue 1: Incorrect Gemini API Format ✅ FIXED
**Problem**: The image data was being sent as raw bytes instead of base64-encoded string.

The Gemini API requires:
```python
# ❌ WRONG (what it was)
image_part = {
    "mime_type": "image/jpeg",
    "data": raw_bytes  # binary data
}

# ✅ CORRECT (what it is now)
image_part = {
    "mime_type": "image/jpeg",
    "data": base64.b64encode(raw_bytes).decode("utf-8")  # base64 string
}
```

**Fix Applied**: Updated `/ai-services/cv_module/vision.py` to properly base64-encode images before sending to Gemini API.

### Issue 2: Weak Error Handling
**Problem**: When classification failed, errors weren't being logged properly, making it hard to debug.

**Fixes Applied**:
- ✅ Added detailed logging with `[DEBUG]`, `[ANALYZE]`, `[ERROR]` prefixes
- ✅ Added traceback printing to see full error stack
- ✅ Added new `/debug/classify` endpoint for testing

### Issue 3: Response Parsing Issues
**Problem**: Gemini might return responses in different formats (e.g., "80%" vs "0.8"), and the parser wasn't handling all cases.

**Fixes Applied**:
- ✅ Now handles both percentage ("80%") and decimal ("0.8") formats
- ✅ Better error recovery for malformed responses
- ✅ Confidence clamping to ensure values stay in [0, 1] range

---

## How to Verify the Fix

### Method 1: Test via New Debug Endpoint

```bash
# 1. Take an image and encode it to base64
cat your_image.jpg | base64 > image_base64.txt

# 2. Send to debug endpoint
curl -X POST http://localhost:8000/debug/classify \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$(cat image_base64.txt)\",
    \"verbose\": true
  }"

# 3. Check response for correct category
```

### Method 2: Test via Citizen Web

1. Start backend & AI service
2. Go to citizen-web → Report Issue
3. Upload an image
4. Check if AI suggestion shows correct category (NOT "Uncategorized")

### Method 3: Check AI Service Logs

Monitor AI service logs for these patterns:

**Good Classification** ✅
```
[ANALYZE] Image decoded: 45230 bytes
[ANALYZE] Classifying image...
✓ YOLO detected: Pothole (0.92)
[ANALYZE] Classification result: Pothole (0.92)
[ANALYZE] Confidence: 92%, Severity: 3.2
```

**Fallback to Gemini** (normal for non-obvious images)
```
[ANALYZE] Image decoded: 45230 bytes
[ANALYZE] Classifying image...
YOLO error: [specific error]
YOLO didn't find a civic issue — using Gemini Vision...
✓ Gemini Vision response:
CATEGORY: Pothole
CONFIDENCE: 0.87
REASON: Image shows damaged road surface with visible cracks
```

**Problem - All Uncategorized** ❌
```
[ERROR] Base64 decode failed: [error]
```
OR
```
[ERROR] Gemini Vision error: [error]
```

---

## Step-by-Step Verification

### Step 1: Verify Environment Variables
```bash
cd ai-services

# Check .env file has GEMINI_API_KEY
grep GEMINI_API_KEY .env

# Should output:
# GEMINI_API_KEY=AIzaSy...
```

### Step 2: Test Classification Directly
```bash
# From ai-services directory
python test_classification.py

# This will test all images in test_images/ directory
# Or create one for testing:
mkdir -p test_images
# Copy a pothole image to test_images/
python test_classification.py
```

### Step 3: Test with ReportIssue Form
1. Go to http://localhost:5173/report-issue (citizen-web)
2. Upload a clear pothole image
3. Watch AI service logs (should see classification logs)
4. Check if AI prediction appears correctly

### Step 4: Check API Response
```bash
# Get base64 image
python3 << 'EOF'
import base64
with open("your_image.jpg", "rb") as f:
    print(base64.b64encode(f.read()).decode())
EOF

# Call endpoint
curl -X POST http://localhost:8000/analyze-and-enhance \
  -H "Content-Type: application/json" \
  -d '{
    "image": "PASTE_BASE64_HERE",
    "description": ""
  }' | jq
```

---

## Files Modified

### `/ai-services/cv_module/vision.py`
**Changes**:
- Fixed Gemini API format: now uses base64 encoding
- Added better error logging and recovery
- Improved response parsing (handles % and decimal formats)
- Added confidence clamping to [0, 1]
- Added detailed debug output

### `/ai-services/app.py`
**Changes**:
- Enhanced `/analyze-and-enhance` endpoint with detailed logging
- Fixed `/health` endpoint to show configuration status
- Added new `/debug/classify` endpoint for testing
- Better error reporting with traceback

### `/ai-services/test_classification.py`
**New File**:
- Test script to verify classification works
- Runs all images in `test_images/` directory
- Shows summary statistics

---

## Common Issues & Solutions

### Issue: "Uncategorized" for all images ❌

**Cause 1: Gemini API Key Invalid**
```bash
# Test API key
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

**Cause 2: Rate Limited**
```bash
# Check if getting 429 errors in logs
# If yes, wait 30 seconds and try again
```

**Cause 3: Image Format Issue**
```bash
# Ensure image is valid JPEG/PNG
file your_image.jpg
# Should output: JPEG image data

# If not, convert:
convert your_image.jpg -quality 85 fixed_image.jpg
```

**Cause 4: Base64 Encoding Error**
- Verify base64 data is not truncated
- Check for extra newlines in base64 string
- Test with small image first

### Issue: "429 Too Many Requests" 🚨

Gemini API has rate limits. Solutions:
1. Wait 60 seconds before retrying
2. Reduce concurrent uploads
3. Use smaller images (resize first)
4. Check API quota at https://console.cloud.google.com

### Issue: "Permission Denied" 🔒

```bash
# Check GEMINI_API_KEY in .env
# Must be valid API key from Google Cloud
# Generate new one at: https://aistudio.google.com/app/apikey
```

### Issue: Classification works sometimes, fails sometimes 🎲

**Cause**: Gemini response format varies
- **Fix**: Already applied - now handles multiple response formats

Check logs for patterns in failing cases.

---

## Quick Diagnostics Script

```bash
#!/bin/bash
# save as check_ai_service.sh

echo "🔍 AI Service Diagnostics"
echo "=========================="

# 1. Check processes
echo -e "\n📊 Process status:"
ps aux | grep -E "python.*app.py|npm.*dev" | grep -v grep

# 2. Check API health
echo -e "\n🏥 Health check:"
curl -s http://localhost:8000/health | jq .

# 3. Check environment
echo -e "\n🔐 Environment check:"
cd ai-services
grep -E "GEMINI|CLOUDINARY" .env | head -5

# 4. Test classification
echo -e "\n🧪 Running test classification:"
python test_classification.py

echo -e "\n✅ Diagnostics complete"
```

---

## Network & Connectivity

### Verify AI Service is Accessible
```bash
# From citizen-web directory
curl http://localhost:8000/health

# Should return JSON with status
```

### Check CORS Headers
```bash
curl -i http://localhost:8000/health

# Should include:
# Access-Control-Allow-Origin: *
```

### Test from Different Machines
```bash
# On another computer
curl http://<your-ip>:8000/health
```

---

## Performance Considerations

### Image Size Impact
- Smaller images = faster classification
- Recommended: under 2MB
- Resize before uploading:
  ```bash
  convert large_image.jpg -resize 1920x1080 optimized.jpg
  ```

### Batch Processing Limits
- Don't upload 15 images simultaneously
- Space them out (1-2 seconds apart)
- Each needs ~2-5 seconds for Gemini to process

---

## Advanced Debugging

### Enable Full Logging
Edit `app.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

### Test Gemini Directly
```python
# In Python terminal
import google.generativeai as genai
from PIL import Image

genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel("gemini-2.5-flash")

image = Image.open("test.jpg")
prompt = "What civic issue is in this image?"
response = model.generate_content([prompt, image])
print(response.text)
```

### Monitor API Usage
```bash
# Check Gemini API usage
# Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

---

## Deployment Checklist

Before deploying to production:

- [ ] GEMINI_API_KEY set in .env
- [ ] GEMINI_API_KEY is valid (not expired)
- [ ] test_classification.py passes all tests
- [ ] /debug/classify endpoint responds correctly
- [ ] Upload 1 test image via UI, verify categorization
- [ ] Check logs show [ANALYZE] prefix (not [ERROR])
- [ ] Performance acceptable (< 10 seconds per upload)
- [ ] Rate limiting in place for API calls

---

## Summary of Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| `cv_module/vision.py` | Wrong Gemini API format | Use base64 encoding |
| `cv_module/vision.py` | Poor error handling | Add detailed logging |
| `cv_module/vision.py` | Response parsing issues | Handle multiple formats |
| `app.py` | Vague error messages | Add traceback + context |
| `app.py` | No testing endpoint | Add `/debug/classify` |
| Testing | No test script | Add `test_classification.py` |

---

## Next Steps If Issues Persist

1. **Check AI Service Logs**: Look for `[ERROR]` prefix messages
2. **Run test_classification.py**: Verify basic functionality
3. **Use /debug/classify endpoint**: Test classification in isolation
4. **Verify Gemini API Key**: Ensure it's valid and has quota
5. **Check Network**: Ensure AI service endpoint is reachable
6. **Monitor Rate Limits**: Check if hitting API quota

---

**Last Updated**: April 8, 2026  
**Status**: ✅ Fixed - Ready for testing

## Support Commands

```bash
# Quick test
curl -X GET http://localhost:8000/health

# Full diagnostics
cd ai-services && python test_classification.py

# Tail logs
tail -f ai-service.log | grep -E "\[ANALYZE\]|\[ERROR\]"

# Check API key validity
grep GEMINI_API_KEY .env
```
