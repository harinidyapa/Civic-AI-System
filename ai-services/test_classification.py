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
        print("Possible causes:")
        print("  1. GEMINI_API_KEY not valid")
        print("  2. Gemini API rate limited")
        print("  3. Image format not supported")
        print("  4. Network connectivity issue")
    else:
        print("\n✅ Classification is working correctly!")

if __name__ == "__main__":
    test_classification()
