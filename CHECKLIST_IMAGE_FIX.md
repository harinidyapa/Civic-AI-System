# ✅ Image Classification Fix - Checklist

## Pre-Testing Setup
- [ ] Read `FIX_COMPLETE_IMAGE_CLASSIFICATION.md` (executive summary)
- [ ] Verify `/ai-services/cv_module/vision.py` is updated
- [ ] Verify `/ai-services/app.py` has debug endpoint
- [ ] Verify `/ai-services/test_classification.py` exists

## Environment Check
- [ ] `GEMINI_API_KEY` in `.env` (check: `grep GEMINI_API_KEY ai-services/.env`)
- [ ] API key starts with `AIzaSy` (not truncated)
- [ ] AI service can start: `python app.py` runs without import errors
- [ ] Network connection to Google API available

## Quick Verification (5 min)

### 1. Service Health
```bash
✓ curl http://localhost:8000/health | jq .
✓ Response includes: "status": "AI Service is running"
✓ Response includes: "gemini_api_configured": true
```

### 2. Image Classification
```bash
✓ python test_classification.py
✓ Success rate > 80%
✓ No [ERROR] messages in output
```

### 3. Debug Endpoint
```bash
✓ curl -X POST http://localhost:8000/debug/classify \
    -H "Content-Type: application/json" \
    -d '{"image": "TEST_IMAGE_BASE64", "verbose": true}'
✓ Response shows: "success": true
✓ Response shows: "predicted_category": "Pothole" (or other correct category)
```

## Citizen Web Test (5 min)

- [ ] Navigate to http://localhost:5173/report-issue
- [ ] Upload a pothole image
- [ ] Verify AI suggestion appears (NOT "Uncategorized")
- [ ] Check AI prediction matches image (should say "Pothole")
- [ ] Check confidence shows > 50%
- [ ] Submit the issue
- [ ] Verify issue created in database with correct category

## Backend Verification (2 min)

- [ ] Check backend logs show issue created
- [ ] Check database: issue.category = "Pothole" (not "Uncategorized")
- [ ] Check admin dashboard shows issue with correct category

## Performance Check (2 min)

- [ ] Each classification takes 2-5 seconds ✓ ACCEPTABLE
- [ ] Upload speeds up after first request (caching kicks in) ✓ GOOD
- [ ] No timeout errors appear ✓ EXPECTED

## Logs Analysis (Important!)

### Expected Logs ✅ GOOD
```
[ANALYZE] Image decoded: 45230 bytes
[ANALYZE] Classifying image...
✓ YOLO detected: Pothole (0.92)
[ANALYZE] Classification result: Pothole (0.92)
```

OR (also good - fallback to Gemini)
```
[ANALYZE] Image decoded: 45230 bytes
[ANALYZE] Classifying image...
YOLO error: ...
YOLO didn't find a civic issue — using Gemini Vision...
✓ Gemini Vision response:
CATEGORY: Pothole
CONFIDENCE: 0.87
[ANALYZE] Classified as: Pothole (87% confidence)
```

### Problem Logs ❌ ACTION NEEDED
```
[ERROR] Gemini Vision error: ...
→ Check GEMINI_API_KEY validity

[ERROR] Base64 decode failed: ...
→ Check image format (must be JPEG/PNG)

[ERROR] 429 Too Many Requests
→ Rate limited - wait 60 seconds

[ANALYZE] Classification result: Uncategorized
→ Image unclear or not a civic issue
```

---

## Testing Scenarios

### Scenario 1: Clear Pothole ✅
- [ ] Upload clear pothole image
- [ ] Expected: "Pothole" with > 80% confidence
- [ ] Check logs: Should see [ANALYZE] messages
- Result: ___________

### Scenario 2: Garbage Pile ✅
- [ ] Upload garbage image
- [ ] Expected: "Garbage" with > 70% confidence
- [ ] Check logs: Should see classification result
- Result: ___________

### Scenario 3: Streetlight ✅
- [ ] Upload broken streetlight image
- [ ] Expected: "Streetlight" with > 60% confidence
- [ ] Check logs: Should see Gemini fallback
- Result: ___________

### Scenario 4: Water Leakage ✅
- [ ] Upload flooding/water leakage image
- [ ] Expected: "Water Leakage" with > 65% confidence
- [ ] Check logs: Should classify correctly
- Result: ___________

### Scenario 5: Random Image ⚠️
- [ ] Upload non-civic image (tree, car, etc.)
- [ ] Expected: "Uncategorized" (is ok for random images)
- [ ] This is correct behavior
- Result: ___________

---

## Issue Resolution Matrix

| Symptom | Cause | Solution |
|---------|-------|----------|
| All images → "Uncategorized" | Gemini API format wrong | ✅ FIXED - restart service |
| API returns 404 | Service not running | `python app.py` in ai-services |
| API returns 500 | Python error | Check `/debug/classify` response |
| Images take > 10s | Rate limited or slow network | Wait and retry, check internet |
| "Invalid image format" | Corrupt image file | Use different image, verify format |
| "GEMINI_API_KEY invalid" | Wrong/expired key | Update .env, restart |

---

## Final Verification Checklist

### Code Changes Verified
- [ ] `/ai-services/cv_module/vision.py` uses base64 encoding
- [ ] `/ai-services/app.py` has [ANALYZE] logging
- [ ] `/ai-services/app.py` has `/debug/classify` endpoint
- [ ] `/ai-services/test_classification.py` exists

### Functionality Verified
- [ ] AI service starts without errors
- [ ] Health endpoint returns success
- [ ] Debug endpoint works with test images
- [ ] Classification returns correct categories
- [ ] Citizen web shows AI suggestions
- [ ] Database stores correct categories

### Performance Verified
- [ ] Classification time: 2-5 seconds
- [ ] No 404/500 errors
- [ ] No rate limiting issues (on first 60 requests/minute)
- [ ] Memory usage normal

### Documentation Verified
- [ ] FIX_COMPLETE_IMAGE_CLASSIFICATION.md updated
- [ ] CLASSIFICATION_QUICK_FIX.md available
- [ ] IMAGE_CLASSIFICATION_FIX.md available
- [ ] CODE_CHANGES_SUMMARY.md available

---

## Sign-Off

**Date**: ________________
**Tester**: ________________
**Status**: 
- [ ] ✅ ALL TESTS PASSED - Ready for Production
- [ ] ⚠️ SOME ISSUES - See details below
- [ ] ❌ CRITICAL ISSUES - Do not deploy

**Issues Found**:
```




```

**Notes**:
```




```

---

## Quick Reference Commands

```bash
# Start AI service
cd ai-services && python app.py

# Test classification
python test_classification.py

# Check health
curl http://localhost:8000/health | jq

# Test specific image
curl -X POST http://localhost:8000/debug/classify \
  -H "Content-Type: application/json" \
  -d '{"image": "BASE64_IMAGE", "verbose": true}'

# View logs
ps aux | grep "python.*app.py"

# Kill and restart
pkill -f "python.*app.py"
python app.py
```

---

## Emergency Rollback

If critical issues arise:

```bash
# Revert changes
cd ai-services
git checkout cv_module/vision.py
git checkout app.py

# Restart
python app.py
```

---

**Status**: ✅ READY FOR TESTING

**When you're ready to test:**
1. Ensure all ✓ boxes above are checked
2. Start AI service: `python app.py`
3. Upload an image in citizen-web
4. Verify correct category appears
5. Check logs show [ANALYZE] messages

**Expected Result**: ✅ Images categorized correctly as Pothole, Garbage, Streetlight, or Water Leakage

Version: 1.0  
Updated: April 8, 2026  
Status: Complete ✅
