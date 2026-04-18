#!/usr/bin/env python3
"""
QUICK TEST - Image Classification Fix Verification
This script performs a quick test of the image classification system.
Run this FIRST before running the full diagnostic.
"""

import os
import sys
import subprocess

def main():
    print("\n" + "="*70)
    print("  QUICK IMAGE CLASSIFICATION TEST")
    print("="*70 + "\n")
    
    # Step 1: Check if .env file exists and has GEMINI_API_KEY
    print("1️⃣  Checking environment variables...")
    
    env_file = ".env"
    if not os.path.exists(env_file):
        print("❌ .env file not found!")
        print("   Create .env with:")
        print("   GEMINI_API_KEY=your_key_here")
        print("   CLOUDINARY_CLOUD_NAME=your_cloud")
        print("   CLOUDINARY_API_KEY=your_api_key")
        print("   CLOUDINARY_API_SECRET=your_secret")
        return 1
    
    # Check if GEMINI_API_KEY is set
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env!")
        return 1
    
    print(f"✅ Found .env with GEMINI_API_KEY: {api_key[:10]}...{api_key[-5:]}")
    
    # Step 2: Test Gemini connection
    print("\n2️⃣  Testing Gemini API connection...")
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Say: Classification API Ready")
        print(f"✅ Gemini API works: {response.text.strip()[:50]}...")
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return 1
    
    # Step 3: Test image classification
    print("\n3️⃣  Testing image classification...")
    test_dir = "test_images"
    
    if not os.path.exists(test_dir):
        print(f"⚠️  {test_dir}/ not found")
        print(f"   Create this directory and add test images:")
        print(f"   - pothole.jpg")
        print(f"   - garbage.jpg")
        print(f"   - water_leak.jpg")
        return 1
    
    # Find test images
    images = []
    for ext in ["jpg", "png", "jpeg"]:
        images.extend(os.listdir(test_dir) if os.path.isdir(test_dir) else [])
    
    if not images:
        print(f"⚠️  No images in {test_dir}/")
        print(f"   Add some test images to proceed")
        return 1
    
    try:
        from cv_module import classify_image
        
        # Test with first image
        test_file = os.path.join(test_dir, images[0])
        print(f"   Testing with: {images[0]}")
        
        with open(test_file, "rb") as f:
            image_bytes = f.read()
        
        category, confidence = classify_image(image_bytes)
        print(f"   Result: {category} ({confidence:.2%})")
        
        if category != "Uncategorized":
            print(f"✅ Classification working! Got: {category}")
        else:
            print(f"⚠️  Got Uncategorized (might be expected for this image)")
    
    except Exception as e:
        print(f"❌ Classification error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Step 4: Summary
    print("\n" + "="*70)
    print("✅ QUICK TEST PASSED!")
    print("="*70)
    print("\nNow run: python diagnostic.py (for full diagnostics)")
    print("        python app.py (to start the AI service)")
    print("\n")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
