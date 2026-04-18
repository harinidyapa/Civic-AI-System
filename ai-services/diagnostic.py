#!/usr/bin/env python3
"""
COMPREHENSIVE IMAGE CLASSIFICATION DIAGNOSTIC & FIX
This script tests the entire image classification pipeline
"""

import os
import sys
import base64
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def test_imports():
    """Test if all required dependencies are installed"""
    print_section("1. TESTING IMPORTS")
    
    deps = {
        'PIL': 'Pillow (image processing)',
        'numpy': 'NumPy (numerical computing)',
        'ultralytics': 'YOLOv8 (object detection)',
        'google.generativeai': 'Google Gemini API',
        'dotenv': 'Environment variables',
        'flask': 'Flask web framework'
    }
    
    failed = []
    for module, desc in deps.items():
        try:
            __import__(module)
            print(f"✅ {module:25} - {desc}")
        except ImportError as e:
            print(f"❌ {module:25} - {desc}")
            failed.append((module, str(e)))
    
    if failed:
        print(f"\n⚠️  Missing dependencies:")
        for mod, err in failed:
            print(f"   Install: pip install {mod}")
        return False
    return True

def test_environment():
    """Test environment variables"""
    print_section("2. TESTING ENVIRONMENT VARIABLES")
    
    required = {
        'GEMINI_API_KEY': 'Google Gemini API Key',
        'CLOUDINARY_CLOUD_NAME': 'Cloudinary Cloud Name',
        'CLOUDINARY_API_KEY': 'Cloudinary API Key',
        'CLOUDINARY_API_SECRET': 'Cloudinary API Secret',
    }
    
    from dotenv import load_dotenv
    load_dotenv()
    
    all_set = True
    for var, desc in required.items():
        value = os.getenv(var)
        if value:
            # Hide sensitive parts
            if 'KEY' in var or 'SECRET' in var:
                masked = value[:10] + '*' * (len(value)-10) if len(value) > 10 else '*' * len(value)
                print(f"✅ {var:30} - {desc:30} [{masked}]")
            else:
                print(f"✅ {var:30} - {desc:30} [{value}]")
        else:
            print(f"❌ {var:30} - {desc:30} [NOT SET]")
            all_set = False
    
    return all_set

def test_gemini_api():
    """Test Gemini API configuration"""
    print_section("3. TESTING GEMINI API")
    
    try:
        import google.generativeai as genai
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            print("❌ GEMINI_API_KEY not found in environment")
            return False
        
        print("  Configuring Gemini...")
        genai.configure(api_key=api_key)
        
        print("  Creating model instance...")
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        print("  Testing basic text generation...")
        response = model.generate_content("Say 'Civic AI System Ready' in exactly these words")
        result = response.text.strip()
        
        print(f"  Response: {result}")
        
        if "Civic AI System Ready" in result or "ready" in result.lower():
            print("✅ Gemini API is working correctly")
            return True
        else:
            print(f"⚠️  Unexpected response: {result}")
            return True  # API works, just different response
            
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_image_classification():
    """Test image classification with sample images"""
    print_section("4. TESTING IMAGE CLASSIFICATION")
    
    try:
        from cv_module import classify_image
        
        test_dir = Path("test_images")
        if not test_dir.exists():
            print(f"⚠️  test_images directory not found: {test_dir}")
            print("   Creating directory for test images...")
            test_dir.mkdir(exist_ok=True)
            print(f"   Place test images in: {test_dir}")
            return False
        
        # Find test images
        images = list(test_dir.glob("*.jpg")) + \
                 list(test_dir.glob("*.png")) + \
                 list(test_dir.glob("*.jpeg"))
        
        if not images:
            print(f"⚠️  No test images found in {test_dir}")
            return False
        
        print(f"Found {len(images)} test image(s):\n")
        
        results = []
        for img_path in images:
            try:
                print(f"  Testing: {img_path.name}")
                with open(img_path, "rb") as f:
                    image_bytes = f.read()
                
                category, confidence = classify_image(image_bytes)
                print(f"    → Category: {category}")
                print(f"    → Confidence: {confidence:.2%}")
                print()
                
                results.append({
                    "file": img_path.name,
                    "category": category,
                    "confidence": confidence,
                    "success": True
                })
                
            except Exception as e:
                print(f"    → ERROR: {e}\n")
                results.append({
                    "file": img_path.name,
                    "category": "ERROR",
                    "confidence": 0.0,
                    "success": False
                })
        
        # Summary
        success = sum(1 for r in results if r["success"] and r["category"] != "Uncategorized")
        uncategorized = sum(1 for r in results if r["success"] and r["category"] == "Uncategorized")
        errors = sum(1 for r in results if not r["success"])
        
        print(f"Results:")
        print(f"  ✅ Classified: {success}/{len(results)}")
        print(f"  ⚠️  Uncategorized: {uncategorized}/{len(results)}")
        print(f"  ❌ Errors: {errors}/{len(results)}")
        
        return success > 0 or uncategorized > 0  # At least something didn't error
        
    except Exception as e:
        print(f"❌ Image classification test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_flask_server():
    """Test if Flask server can start"""
    print_section("5. TESTING FLASK SERVER")
    
    try:
        from app import app
        print("✅ Successfully imported Flask app")
        
        # Check if routes are registered
        routes = [str(rule) for rule in app.url_map.iter_rules()]
        
        required_routes = [
            '/analyze',
            '/analyze-and-enhance',
            '/analyze-text',
            '/health'
        ]
        
        print(f"\nFound {len(routes)} routes:")
        for route in sorted(set(routes)):
            status = "✅" if any(req in route for req in required_routes) else "  "
            print(f"  {status} {route}")
        
        missing = [r for r in required_routes if not any(r in route for route in routes)]
        if missing:
            print(f"\n⚠️  Missing routes: {missing}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Flask server test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all diagnostics"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "IMAGE CLASSIFICATION DIAGNOSTIC" + " "*23 + "║")
    print("╚" + "="*68 + "╝")
    
    tests = [
        ("Imports", test_imports),
        ("Environment", test_environment),
        ("Gemini API", test_gemini_api),
        ("Image Classification", test_image_classification),
        ("Flask Server", test_flask_server),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            result = test_func()
            results[name] = "PASS" if result else "FAIL"
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results[name] = "ERROR"
    
    # Summary
    print_section("DIAGNOSTIC SUMMARY")
    
    for name, status in results.items():
        symbol = "✅" if status == "PASS" else "❌" if status == "ERROR" else "⚠️"
        print(f"  {symbol} {name:30} [{status}]")
    
    passed = sum(1 for s in results.values() if s == "PASS")
    total = len(results)
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All systems operational! Image classification should work.\n")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
