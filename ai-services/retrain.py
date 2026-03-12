"""
retrain.py - Auto-retraining pipeline for civic issue detection model
Triggered automatically when any category reaches 15+ images.
Uses collected training_data/ images to fine-tune YOLOv8.
"""

import os
import json
import shutil
import yaml
from pathlib import Path
from datetime import datetime
from ultralytics import YOLO

# ── Config ──────────────────────────────────────────
TRAINING_DATA_DIR = os.path.join(os.path.dirname(__file__), "training_data")
DATASET_DIR       = os.path.join(os.path.dirname(__file__), "dataset")
MODELS_DIR        = os.path.join(os.path.dirname(__file__), "models")
RETRAIN_LOG       = os.path.join(os.path.dirname(__file__), "retrain_log.json")

RETRAIN_THRESHOLD = 15       # retrain when any category hits this
BASE_MODEL        = "yolov8n-cls.pt"   # classification variant of YOLOv8

CIVIC_CATEGORIES = ["Pothole", "Garbage", "Streetlight", "Water Leakage"]

os.makedirs(MODELS_DIR, exist_ok=True)


# ── Helpers ─────────────────────────────────────────

def get_training_stats():
    """Returns dict of category → image count."""
    stats = {}
    if not os.path.exists(TRAINING_DATA_DIR):
        return stats
    for category in CIVIC_CATEGORIES:
        cat_dir = os.path.join(TRAINING_DATA_DIR, category)
        if os.path.isdir(cat_dir):
            images = [f for f in os.listdir(cat_dir) if f.endswith(".jpg")]
            stats[category] = len(images)
        else:
            stats[category] = 0
    return stats


def should_retrain():
    """
    Returns True if any category has >= RETRAIN_THRESHOLD images
    AND we haven't already retrained on this batch.
    """
    stats = get_training_stats()
    total = sum(stats.values())

    # Load last retrain log
    last_retrain_total = 0
    if os.path.exists(RETRAIN_LOG):
        with open(RETRAIN_LOG) as f:
            log = json.load(f)
            last_retrain_total = log.get("total_images_at_last_retrain", 0)

    # Check if any category hit threshold AND we have new data since last retrain
    any_category_ready = any(count >= RETRAIN_THRESHOLD for count in stats.values())
    has_new_data = total > last_retrain_total

    print(f"Training stats: {stats}")
    print(f"Total images: {total}, Last retrain at: {last_retrain_total}")
    print(f"Any category ready: {any_category_ready}, Has new data: {has_new_data}")

    return any_category_ready and has_new_data, stats, total


def prepare_dataset(stats):
    """
    Prepares YOLOv8 classification dataset structure:
    dataset/
      train/
        Pothole/   ← images
        Garbage/
        ...
      val/
        Pothole/
        Garbage/
        ...
    """
    print("\n📁 Preparing dataset...")

    # Clean old dataset
    if os.path.exists(DATASET_DIR):
        shutil.rmtree(DATASET_DIR)

    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir   = os.path.join(DATASET_DIR, "val")

    for category in CIVIC_CATEGORIES:
        count = stats.get(category, 0)
        if count == 0:
            continue

        src_dir = os.path.join(TRAINING_DATA_DIR, category)
        images  = [f for f in os.listdir(src_dir) if f.endswith(".jpg")]

        # 80% train, 20% val
        split     = max(1, int(len(images) * 0.8))
        train_imgs = images[:split]
        val_imgs   = images[split:] if len(images) > split else images[:1]  # at least 1 val

        # Copy to dataset folders
        for img in train_imgs:
            dst = os.path.join(train_dir, category)
            os.makedirs(dst, exist_ok=True)
            shutil.copy(os.path.join(src_dir, img), os.path.join(dst, img))

        for img in val_imgs:
            dst = os.path.join(val_dir, category)
            os.makedirs(dst, exist_ok=True)
            shutil.copy(os.path.join(src_dir, img), os.path.join(dst, img))

        print(f"  {category}: {len(train_imgs)} train, {len(val_imgs)} val")

    print(f"✓ Dataset prepared at {DATASET_DIR}")
    return train_dir, val_dir


def run_training():
    """Fine-tunes YOLOv8 classification model on civic dataset."""
    print("\n🚀 Starting YOLOv8 fine-tuning...")

    model = YOLO(BASE_MODEL)

    results = model.train(
        data=DATASET_DIR,
        epochs=20,           # enough for fine-tuning on small dataset
        imgsz=224,           # classification image size
        batch=8,
        patience=5,          # early stopping
        project=MODELS_DIR,
        name=f"civic_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        exist_ok=True,
        verbose=True
    )

    # Find best model path
    best_model_path = None
    for root, dirs, files in os.walk(MODELS_DIR):
        for f in files:
            if f == "best.pt":
                best_model_path = os.path.join(root, f)

    if best_model_path:
        # Copy as latest model
        latest_path = os.path.join(MODELS_DIR, "civic_latest.pt")
        shutil.copy(best_model_path, latest_path)
        print(f"\n✓ Best model saved to: {latest_path}")
        return latest_path

    return None


def update_retrain_log(total, model_path, stats):
    """Saves retrain metadata for tracking."""
    log = {
        "last_retrain": datetime.utcnow().isoformat(),
        "total_images_at_last_retrain": total,
        "model_path": model_path,
        "categories_used": stats
    }
    with open(RETRAIN_LOG, "w") as f:
        json.dump(log, f, indent=2)
    print(f"✓ Retrain log updated")


# ── Main entry point ─────────────────────────────────

def maybe_retrain():
    """
    Call this after every new training sample is saved.
    Checks threshold and retrains if needed.
    Returns: dict with status info
    """
    ready, stats, total = should_retrain()

    if not ready:
        print("⏳ Not enough data yet for retraining.")
        return {
            "retrained": False,
            "reason": "threshold not reached",
            "stats": stats,
            "threshold": RETRAIN_THRESHOLD
        }

    print(f"\n{'='*50}")
    print(f"🎯 RETRAINING TRIGGERED! {total} total images collected.")
    print(f"{'='*50}")

    try:
        # Step 1: Prepare dataset
        prepare_dataset(stats)

        # Step 2: Train model
        model_path = run_training()

        # Step 3: Log it
        if model_path:
            update_retrain_log(total, model_path, stats)
            print(f"\n✅ Retraining complete! New model: {model_path}")
            return {
                "retrained": True,
                "model_path": model_path,
                "stats": stats,
                "total_images": total
            }

    except Exception as e:
        print(f"❌ Retraining failed: {e}")
        return {
            "retrained": False,
            "reason": str(e),
            "stats": stats
        }


if __name__ == "__main__":
    # Run manually to check and retrain
    result = maybe_retrain()
    print("\nResult:", json.dumps(result, indent=2, default=str))