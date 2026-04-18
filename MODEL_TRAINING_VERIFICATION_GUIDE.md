# How to Verify Model Training from Issue Reports

## Quick Answer
✅ **Only the FIRST image from each issue is saved for training**  
✅ **Retraining happens automatically when ANY category reaches 15+ images**  
✅ **You can verify it multiple ways** (see below)

---

## Training Data Flow

```
User uploads issue with 15 images
    ↓
Backend saves FIRST image + metadata to training_data/<category>/
    ↓
Background check triggers (after every save)
    ↓
If any category has ≥15 images → Auto-retrain starts
    ↓
New model saved to models/civic_model_<timestamp>/best.pt
    ↓
Model actively used for next predictions
```

### Important: Only 1 image per issue saves
- Report issue with 1 image? → 1 training sample
- Report issue with 15 images? → 1 training sample (only first image)
- This is intentional (fire-and-forget, non-blocking)

---

## Way 1: Check Training Stats via API

### Endpoint
```
GET http://localhost:8000/training-stats
```

### Response Example
```json
{
  "total_training_samples": 45,
  "by_category": {
    "Pothole": {
      "total_images": 18,
      "corrections": 3
    },
    "Garbage": {
      "total_images": 15,
      "corrections": 1
    },
    "Streetlight": {
      "total_images": 8,
      "corrections": 0
    },
    "Water Leakage": {
      "total_images": 4,
      "corrections": 0
    }
  },
  "ready_for_retraining": false
}
```

### Interpretation
- ✅ **`Pothole: 18`** → Retraining already happened (was 15+)
- ✅ **`Garbage: 15`** → EXACTLY at threshold, retraining might trigger soon
- ⏳ **`Streetlight: 8`** → Need 7 more images to trigger retraining
- ⏳ **`Water Leakage: 4`** → Need 11 more images
- 🔍 **`corrections: 3`** → User corrected AI 3 times (good for quality!)

---

## Way 2: Check File System - Training Data Saved

### Location
```
<project>/ai-services/training_data/<CATEGORY>/<uuid>.jpg
<project>/ai-services/training_data/<CATEGORY>/<uuid>.json
```

### Example Structure
```
ai-services/training_data/
├── Pothole/
│   ├── f5e27f42-3547-4e72-8907-0f5f0ec4dbd7.jpg
│   ├── f5e27f42-3547-4e72-8907-0f5f0ec4dbd7.json
│   ├── 515df709-9156-4e35-93a0-8e95dc58aa0b.jpg
│   └── 515df709-9156-4e35-93a0-8e95dc58aa0b.json
├── Garbage/
│   ├── 3367b090-0af8-4e68-8434-863ba09f1c97.jpg
│   └── 3367b090-0af8-4e68-8434-863ba09f1c97.json
└── Streetlight/
    └── ...
```

### Check with Command
```bash
# Count images in each category
cd ai-services/training_data
for dir in Pothole Garbage Streetlight "Water Leakage"; do
  count=$(ls "$dir"/*.jpg 2>/dev/null | wc -l)
  echo "$dir: $count images"
done
```

### Metadata JSON Example
```json
{
  "sample_id": "f5e27f42-3547-4e72-8907-0f5f0ec4dbd7",
  "issue_id": "66a5f3c2b8e9f0d2e4c5a6b7",
  "confirmed_category": "Pothole",
  "ai_predicted_category": "Pothole",
  "ai_confidence": 87.5,
  "was_corrected": false,
  "timestamp": "2026-04-08T14:32:15.123456"
}
```

**Key Field**: `was_corrected`
- `true` = AI predicted wrong, user corrected it ✏️
- `false` = AI was correct ✅

---

## Way 3: Check File System - Model Was Retrained

### Location
```
<project>/ai-services/models/
└── civic_model_20260408_143215/
    ├── weights/
    ├── best.pt          ← NEW MODEL (actively used)
    ├── last.pt
    ├── training_results.csv
    └── results.png
```

### How to Find It
```bash
# List all retrained models with timestamps
ls -lt ai-services/models/

# Example output:
# civic_model_20260408_143215/  ← Most recent (April 8, 2:32 PM)
# civic_model_20260407_091045/  ← Previous (April 7, 9:10 AM)
```

### What Each Timestamp Tells You
```
civic_model_20260408_143215/
           │
           └─ 20260408_143215
              │└─ Year: 2026
              ├─ Month: 04 (April)
              ├─ Day: 08
              └─ Time: 14:32:15 (2:32:15 PM)
```

---

## Way 4: Check Retraining Log - Most Reliable

### Location
```
ai-services/retrain_log.json
```

### Example
```json
{
  "last_retrain_timestamp": "2026-04-08T14:32:15.123456",
  "total_images_at_last_retrain": 45,
  "categories_trained": {
    "Pothole": 18,
    "Garbage": 15,
    "Streetlight": 8,
    "Water Leakage": 4
  },
  "training_epochs": 20,
  "model_performance": {
    "accuracy": 92.3,
    "best_model_path": "models/civic_model_20260408_143215/best.pt"
  },
  "status": "completed"
}
```

**This is the source of truth!**
- ✅ Shows EXACT time retraining completed
- ✅ Shows total images used
- ✅ Shows accuracy of new model
- ✅ Shows path to new best model

---

## Way 5: Check Backend Logs - Watch It Happen

### What to Look For

When you submit an issue, watch the backend logs:

```
[AI-SERVICE] ✓ Training data saved for issue 66a5f3c2b8e9f0d2e4c5a6b7 [Pothole]
```

If this is the 15th image in Pothole category:

```
🔍 Retrain check triggered in background...
Training stats: {'Pothole': 15, 'Garbage': 8, ...}
Total images: 23, Last retrain at: 8
Any category ready: True, Has new data: True

📁 Preparing dataset...
  Pothole: 12 train, 3 val
  Garbage: 6 train, 2 val
  ...

🚀 Starting YOLOv8 fine-tuning...
Epoch 1/20: 100% ████████ [00:45<00:00, loss=0.234]
Epoch 2/20: 100% ████████ [00:43<00:00, loss=0.189]
...
✓ Model retraining complete! Best model: 92.3% accuracy
✓ Retrain log updated
```

---

## Complete Verification Checklist

### For Each Issue Report:

- [ ] Upload issue on citizen-web
- [ ] Check backend log: `✓ Training data saved...`
- [ ] Call `GET /training-stats` via Postman/curl
  - Count for that category increased by 1? ✅

### When You Reach 15 Images in a Category:

- [ ] Backend logs show: `🔍 Retrain check triggered...`
- [ ] Training starts: `🚀 Starting YOLOv8 fine-tuning...`
- [ ] Check file system: `ai-services/models/civic_model_YYYYMMDD_HHMMSS/` created
- [ ] Verify success: `ai-services/retrain_log.json` updated with new timestamp
- [ ] Call `GET /training-stats` → should see accuracy improved

---

## Test Scenario: Verify 15 Images Trigger Retraining

### Step 1: Clear History (Optional)
```bash
# Backup old training data
mv ai-services/training_data ai-services/training_data.bak

# Start fresh
mkdir ai-services/training_data/{Pothole,Garbage,Streetlight,"Water Leakage"}
```

### Step 2: Submit 15 Pothole Issues
- Go to citizen-web
- Click "Report Issue" 15 times
- Each time: upload 1 pothole image → submit
- Category: "Pothole"

### Step 3: Watch the Magic
- After issue #15 is submitted:
  - Backend: `🚀 Starting YOLOv8 fine-tuning...`
  - File system: New `models/civic_model_*/` folder appears
  - API: `GET /training-stats` shows Pothole retraining metadata

### Step 4: Verify
```bash
# Check training stats
curl http://localhost:8000/training-stats | jq

# Check model timestamp
ls -lt ai-services/models/ | head -1

# Check accuracy
cat ai-services/retrain_log.json | jq .model_performance
```

---

## Common Questions

### Q: If I upload 15 images in ONE issue, does that count as 15 training samples?
**A:** ❌ No. Only the FIRST image is used for training.  
Only 1 training sample = 1 towards the 15-image threshold.

### Q: Why is retraining automatic but not immediate?
**A:** Retraining runs in a background thread so it doesn't block user requests.  
Retraining takes ~5-10 minutes for YOLOv8 fine-tuning.

### Q: How do I know the new retrained model is being used?
**A:** Once `best.pt` is created in the latest `models/civic_model_*/` folder,  
the system automatically loads it for predictions.  
Models are loaded fresh on each API call.

### Q: What if user corrects an AI prediction?
**A:** Metadata saves `"was_corrected": true`.  
This means that image is EXTRA valuable because it's a correction.  
Shows up in `/training-stats` as `corrections` count.

### Q: Where's the accuracy metric?
**A:** In `retrain_log.json` → `model_performance.accuracy`.  
Also in YOLOv8 training output: `results.csv` in the model folder.

### Q: Can I manually trigger retraining?
**A:** Call the retraining function:
```python
# In AI service directory
python -c "from retrain import maybe_retrain; maybe_retrain()"
```

---

## Troubleshooting

### 📍 Issue: Files not saving to `training_data/`
- Check: `ai-services/training_data/` folder exists
- Check: Backend logs for `save-training-data error:`
- Check: Folder has write permissions

### 📍 Issue: All files in correct location but model not retraining
- Check: Run `GET /training-stats` to see actual count
- Check: Is it really ≥15 for ANY category?
- Check: Clear `retrain_log.json` to force recheck
- Check: Backend logs - is retraining starting?

### 📍 Issue: Retraining started but no new `best.pt` created
- Check: `DATASET_DIR` has images
- Check: YOLOv8 has GPU/resources
- Check: Check `results.png` in model folder for training graph

### 📍 Issue: Retrain log shows old timestamp
- Manually trigger: `python retrain.py` in `ai-services/`
- Or submit issue #16 in same category (should check again)

---

## Pro Tips 🚀

1. **Monitor in Real-Time**
   ```bash
   # Watch backend logs
   tail -f backend.log | grep -E "\[AI\]|Training|Retrain"
   ```

2. **Batch Upload Test Data**
   ```bash
   # If you have local images for testing
   for i in {1..15}; do
     copy image_$i.jpg → ai-services/training_data/Pothole/
   done
   ```

3. **Check Model Quality**
   ```bash
   # View training curve
   open ai-services/models/civic_model_latest/results.png
   ```

4. **Export Training Dataset**
   ```bash
   # Back up the training data
   zip -r training_data_backup_$(date +%s).zip ai-services/training_data/
   ```

---

**Last Updated**: April 8, 2026  
**Status**: ✅ Complete verification system in place
