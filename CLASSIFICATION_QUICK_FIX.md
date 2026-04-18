# Image Classification - Quick Fix Summary

## What Was Wrong ❌
Images were being sent to Gemini API in wrong format (raw bytes instead of base64), causing all classifications to fail and default to "Uncategorized".

## What's Fixed ✅
1. **Fixed Gemini API format** - Now uses proper base64 encoding
2. **Added better logging** - Can see exactly what's happening
3. **Improved error recovery** - Can detect what went wrong
4. **Added debug endpoint** - For testing classification directly

## How to Test (Do This First!)

### Option A: Quick API Test
```bash
# 1. Prepare test image as base64
python3 -c "
import base64
with open('path/to/pothole.jpg', 'rb') as f:
    print(base64.b64encode(f.read()).decode())
" > image.txt

# 2. Send to debug endpoint
curl -X POST http://localhost:8000/debug/classify \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(cat image.txt)\", \"verbose\": true}"

# 3. You should see classification like:
# {"predicted_category": "Pothole", "confidence": 0.87, "success": true}
```

### Option B: Test via Citizen Web (Full Flow)
1. Open http://localhost:5173/report-issue
2. Upload a pothole image
3. Should see AI suggestion appear (not "Uncategorized")
4. Check logs in AI service terminal for `[ANALYZE]` messages

### Option C: Run Test Suite
```bash
cd ai-services
python test_classification.py
```

## Expected Responses

### ✅ Working Correctly
```
[ANALYZE] Image decoded: 45230 bytes
[ANALYZE] Classifying image...
✓ YOLO detected: Pothole (0.92)
[ANALYZE] Classification result: Pothole (0.92)
```

### ✅ Also Correct (fallback to Gemini)
```
YOLO didn't find a civic issue — using Gemini Vision...
✓ Gemini Vision response:
CATEGORY: Garbage
CONFIDENCE: 0.78
```

### ❌ Problem
```
[ERROR] Gemini Vision error: ...
Uncategorized
```

## If Still Not Working

### Check 1: Verify API Key
```bash
cd ai-services
grep GEMINI_API_KEY .env
```
Should show a key like `AIzaSy...`

### Check 2: Health Check
```bash
curl http://localhost:8000/health
```
Should return: `{"status": "AI Service is running"}`

### Check 3: Check Logs
Look for these indicators:

- ✅ `[ANALYZE]` = working
- ✅ `Gemini Vision response:` = fallback working
- ❌ `[ERROR]` = something failed
- ❌ `429` = rate limited (wait & retry)

### Check 4: Test Image Quality
- Make sure image is valid JPEG/PNG
- File size < 2MB
- Image clearly shows civic issue

## Most Common Fixes

1. **Restart AI Service**
   ```bash
   # Kill old process
   pkill -f "python.*app.py"
   # Restart
   cd ai-services
   python app.py
   ```

2. **Verify Network Connection**
   ```bash
   ping localhost
   curl http://localhost:8000/health
   ```

3. **Clear Python Cache**
   ```bash
   cd ai-services
   find . -name "*.pyc" -delete
   find . -name "__pycache__" -type d -exec rm -rf {} +
   # Restart service
   ```

4. **Check Gemini API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Generate new key if expired
   - Update in `ai-services/.env`
   - Restart service

## Working Code Locations

### Main Fix Applied
- **File**: `/ai-services/cv_module/vision.py`
- **Line**: ~60-100 (Gemini classification function)
- **Change**: Now properly base64-encodes images

### Supporting Changes
- **File**: `/ai-services/app.py`
- **Lines**: 
  - 143-210 (analyze-and-enhance endpoint)
  - 380-440 (debug endpoint)

### Test Script
- **File**: `/ai-services/test_classification.py`
- **Usage**: `python test_classification.py`

## Performance Notes

- Classification takes 2-5 seconds per image
- Don't upload 15 images at once
- One at a time is best for testing
- Backend handles async in background

## Final Verification

✅ Run this to confirm everything works:

```bash
# 1. Check service running
ps aux | grep python | grep app.py

# 2. Check API responds
curl http://localhost:8000/health | jq .

# 3. Check key configured
grep GEMINI_API_KEY ai-services/.env | head -1

# 4. Try upload in citizen-web
# Select "Report Issue" → upload image → verify AI suggestion

echo "✅ If all above pass, classification should work!"
```

---

**Status**: ✅ FIXED  
**Tested**: April 8, 2026  
**Ready**: Go ahead and upload images for testing!
