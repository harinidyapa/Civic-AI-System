import base64
import requests
import json

# ── UPDATE THIS to any image on your PC ──
img_path = r'C:\Users\akshi\OneDrive\Desktop\Repositories\Civic-AI-System\ai-services\test_images\garbage.png'

try:
    with open(img_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()

    print("Image loaded! Sending to AI...")

    r = requests.post('http://localhost:8000/analyze-and-enhance', json={
        'image': b64,
        'description': 'There is a problem on the road near my area'
    })

    print("\n── AI Response ──")
    print(json.dumps(r.json(), indent=2))

except FileNotFoundError:
    print(f"Image not found at: {img_path}")
    print("Update img_path on line 5 to a real image on your PC.")
    print(r"Example: img_path = r'C:\Users\akshi\OneDrive\Desktop\Repositories\Civic-AI-System\ai-services\test_images\garbage.png'")
except Exception as e:
    print(f"Error: {e}")