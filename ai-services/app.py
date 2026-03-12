from flask import Flask, request, jsonify
from cv_module import classify_image, calculate_severity, scale_confidence
from nlp_module import generate_description, analyze_text_comprehensive, classify_text, summarize_text, detect_urgency
import base64
import os
import json
import uuid
from datetime import datetime
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

TRAINING_DATA_DIR = os.path.join(os.path.dirname(__file__), "training_data")
os.makedirs(TRAINING_DATA_DIR, exist_ok=True)

app = Flask(__name__)

# ──────────────────────────────────────────────
# EXISTING ENDPOINTS (unchanged)
# ──────────────────────────────────────────────

@app.route("/analyze", methods=["POST"])
def analyze():
    """Complete image analysis: classification, severity, description, and AI insights."""
    data = request.json
    image_base64 = data.get("image")

    if not image_base64:
        return jsonify({"error": "Image required"}), 400

    image_bytes = base64.b64decode(image_base64)
    category, raw_confidence = classify_image(image_bytes)
    description = generate_description(category)
    confidence_percent = scale_confidence(raw_confidence)
    severity = calculate_severity(category, confidence_percent, image_bytes)
    is_miscategorized = confidence_percent < 50

    return jsonify({
        "predicted_category": category,
        "confidence_percent": confidence_percent,
        "generated_description": description,
        "severity_score": severity,
        "is_miscategorized": is_miscategorized
    })


@app.route("/analyze-text", methods=["POST"])
def analyze_text():
    """Comprehensive text analysis: classification + summarization + urgency detection."""
    data = request.json
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text required"}), 400

    try:
        result = analyze_text_comprehensive(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify-text", methods=["POST"])
def classify_text_endpoint():
    """Text classification only."""
    data = request.json
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text required"}), 400

    try:
        category, confidence = classify_text(text)
        return jsonify({"category": category, "confidence": confidence})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/summarize-text", methods=["POST"])
def summarize_text_endpoint():
    """Text summarization only."""
    data = request.json
    text = data.get("text", "").strip()
    max_length = data.get("max_length", 50)
    min_length = data.get("min_length", 20)

    if not text:
        return jsonify({"error": "Text required"}), 400

    try:
        summary = summarize_text(text, max_length, min_length)
        return jsonify({
            "summary": summary,
            "original_length": len(text),
            "summary_length": len(summary)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/detect-urgency", methods=["POST"])
def detect_urgency_endpoint():
    """Urgency detection."""
    data = request.json
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text required"}), 400

    try:
        urgency_level, urgency_label, keywords = detect_urgency(text)
        return jsonify({
            "urgency_level": urgency_level,
            "urgency_label": urgency_label,
            "keywords_found": keywords
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
# NEW ENDPOINT 1: Analyze image + enhance description together
# Called by frontend right after image upload
# ──────────────────────────────────────────────

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
        image_bytes = base64.b64decode(image_base64)

        # Step 1: CV - detect category from image
        category, raw_confidence = classify_image(image_bytes)
        confidence_percent = scale_confidence(raw_confidence)
        severity = calculate_severity(category, confidence_percent, image_bytes)
        is_miscategorized = confidence_percent < 50

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
            "ai_suggested": True   # flag so frontend can show "AI Suggested" badge
        })

    except Exception as e:
        print(f"analyze-and-enhance error: {e}")
        return jsonify({"error": str(e)}), 500


def _build_enhanced_description(category, confidence, user_text, text_analysis):
    """
    Merges AI insights with user text to produce a richer description.
    Keeps user's intent but adds structured civic language.
    """
    summary = text_analysis.get("summary", "")
    urgency_label = text_analysis.get("urgency", {}).get("label", "Low")
    ai_category = text_analysis.get("classification", {}).get("category", category)

    # If AI text classification agrees with vision, reinforce it
    detected_category = category if category != "Uncategorized" else ai_category

    if summary and len(summary) > 20:
        enhanced = (
            f"[{detected_category} Issue – {urgency_label} Urgency] "
            f"{summary} "
            f"Immediate civic attention is requested to address this {detected_category.lower()} concern."
        )
    else:
        enhanced = (
            f"[{detected_category} Issue – {urgency_label} Urgency] "
            f"{user_text} "
            f"This {detected_category.lower()} issue requires prompt municipal action."
        )

    return enhanced.strip()


# ──────────────────────────────────────────────
# NEW ENDPOINT 2: Save training data for model retraining
# Called by backend after issue is successfully submitted
# ──────────────────────────────────────────────

@app.route("/save-training-data", methods=["POST"])
def save_training_data():
    """
    Saves the submitted image + confirmed label for future model retraining.
    
    Expects:
    - image: base64 encoded image
    - confirmed_category: the final category (user may have edited AI suggestion)
    - ai_category: what AI originally predicted
    - confidence: AI confidence score
    - issue_id: backend issue ID for traceability
    
    Saves to:
    - Local: training_data/<category>/<uuid>.jpg  +  metadata JSON
    - Cloudinary: training_data/<category>/ folder
    """
    data = request.json
    image_base64 = data.get("image")
    confirmed_category = data.get("confirmed_category", "Uncategorized")
    ai_category = data.get("ai_category", "Uncategorized")
    confidence = data.get("confidence", 0)
    issue_id = data.get("issue_id", "unknown")

    if not image_base64:
        return jsonify({"error": "Image required"}), 400

    try:
        image_bytes = base64.b64decode(image_base64)
        sample_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # ── 1. Save locally ──
        category_dir = os.path.join(TRAINING_DATA_DIR, confirmed_category)
        os.makedirs(category_dir, exist_ok=True)

        # Save image file
        image_path = os.path.join(category_dir, f"{sample_id}.jpg")
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        # Save metadata alongside image
        metadata = {
            "sample_id": sample_id,
            "issue_id": issue_id,
            "confirmed_category": confirmed_category,
            "ai_predicted_category": ai_category,
            "ai_confidence": confidence,
            "was_corrected": confirmed_category != ai_category,
            "timestamp": timestamp
        }
        meta_path = os.path.join(category_dir, f"{sample_id}.json")
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        # ── 2. Save to Cloudinary ──
        cloudinary_result = None
        try:
            upload_response = cloudinary.uploader.upload(
                f"data:image/jpeg;base64,{image_base64}",
                folder=f"training_data/{confirmed_category}",
                public_id=sample_id,
                context=f"issue_id={issue_id}|ai_category={ai_category}|confirmed={confirmed_category}|confidence={confidence}"
            )
            cloudinary_result = upload_response.get("secure_url")
        except Exception as cloud_err:
            print(f"Cloudinary upload warning (non-fatal): {cloud_err}")

        # ── 3. Check if retraining should be triggered ──
        # Runs in background thread — never blocks the response
        try:
            import threading
            from retrain import maybe_retrain
            threading.Thread(target=maybe_retrain, daemon=True).start()
            print("🔍 Retrain check triggered in background...")
        except Exception as retrain_err:
            print(f"Retrain check error (non-fatal): {retrain_err}")

        return jsonify({
            "success": True,
            "sample_id": sample_id,
            "saved_locally": True,
            "local_path": image_path,
            "saved_to_cloudinary": cloudinary_result is not None,
            "cloudinary_url": cloudinary_result,
            "was_corrected": confirmed_category != ai_category,
            "timestamp": timestamp
        })

    except Exception as e:
        print(f"save-training-data error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/training-stats", methods=["GET"])
def training_stats():
    """
    Returns stats about collected training data per category.
    Useful for admin dashboard to know when enough data exists to retrain.
    """
    stats = {}
    total = 0

    if os.path.exists(TRAINING_DATA_DIR):
        for category in os.listdir(TRAINING_DATA_DIR):
            cat_dir = os.path.join(TRAINING_DATA_DIR, category)
            if os.path.isdir(cat_dir):
                images = [f for f in os.listdir(cat_dir) if f.endswith(".jpg")]
                corrections = 0
                for f in os.listdir(cat_dir):
                    if f.endswith(".json"):
                        try:
                            with open(os.path.join(cat_dir, f)) as mf:
                                meta = json.load(mf)
                                if meta.get("was_corrected"):
                                    corrections += 1
                        except Exception:
                            pass
                stats[category] = {
                    "total_images": len(images),
                    "corrections": corrections
                }
                total += len(images)

    return jsonify({
        "total_training_samples": total,
        "by_category": stats,
        "ready_for_retraining": total >= 100  # threshold hint
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "AI Service is running", "version": "2.0"}), 200

@app.route("/rag-suggest", methods=["POST"])
def rag_suggest():
    """
    RAG endpoint for crew resolution suggestions.
    Receives current issue + similar resolved issues from backend.
    Generates step-by-step resolution guide using Gemini.
    """
    from nlp_module import generate_description
    import google.generativeai as genai
    gemini = genai.GenerativeModel("gemini-2.5-flash")

    data = request.json
    current_issue = data.get("current_issue", {})
    similar_issues = data.get("similar_issues", [])

    if not current_issue:
        return jsonify({"error": "current_issue required"}), 400

    try:
        context = ""
        if similar_issues:
            context = "PAST RESOLVED SIMILAR ISSUES:\n"
            for i, issue in enumerate(similar_issues, 1):
                context += f"""
Issue {i}:
- Title: {issue.get('title', 'N/A')}
- Category: {issue.get('category', 'N/A')}
- Description: {issue.get('description', 'N/A')}
- How it was resolved: {issue.get('resolution_comment', 'Resolved successfully')}
"""

        prompt = f"""You are an expert municipal crew supervisor with years of field experience.

{context}

CURRENT ISSUE TO RESOLVE:
- Title: {current_issue.get('title', 'N/A')}
- Category: {current_issue.get('category', 'N/A')}
- Description: {current_issue.get('description', 'N/A')}
- Urgency: {current_issue.get('urgencyLabel', 'Medium')}

Based on the past resolved issues above and your expertise, provide a clear resolution guide.

Reply in this EXACT format:
SUMMARY: <one sentence describing the fix approach>
STEPS:
1. <first action>
2. <second action>
3. <third action>
4. <fourth action if needed>
MATERIALS: <comma separated list of materials needed>
ESTIMATED_TIME: <realistic time estimate e.g. "2-4 hours">
SAFETY_NOTE: <one important safety precaution>

Nothing else. Be specific and practical."""

        response = gemini.generate_content(prompt)
        result = response.text.strip()

        suggestion = {
            "summary": "", "steps": [], "materials": [],
            "estimated_time": "", "safety_note": "",
            "based_on": len(similar_issues)
        }

        current_section = None
        for line in result.split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("SUMMARY:"):
                suggestion["summary"] = line.replace("SUMMARY:", "").strip()
            elif line.startswith("STEPS:"):
                current_section = "steps"
            elif line.startswith("MATERIALS:"):
                current_section = None
                suggestion["materials"] = [m.strip() for m in line.replace("MATERIALS:", "").strip().split(",")]
            elif line.startswith("ESTIMATED_TIME:"):
                current_section = None
                suggestion["estimated_time"] = line.replace("ESTIMATED_TIME:", "").strip()
            elif line.startswith("SAFETY_NOTE:"):
                current_section = None
                suggestion["safety_note"] = line.replace("SAFETY_NOTE:", "").strip()
            elif current_section == "steps" and line and line[0].isdigit():
                step = line.split(".", 1)[-1].strip() if "." in line else line[2:].strip()
                suggestion["steps"].append(step)

        return jsonify(suggestion)

    except Exception as e:
        print(f"RAG suggest error: {e}")
        return jsonify({"error": str(e)}), 500
    
    # Add this endpoint to ai-services/app.py (before the if __name__ == "__main__" block)

# REPLACE the existing /rag-describe route in app.py with this:

@app.route("/rag-describe", methods=["POST"])
def rag_describe():
    import google.generativeai as genai
    gemini = genai.GenerativeModel("gemini-2.5-flash")

    data        = request.json
    description = data.get("description", "").strip()
    category    = data.get("category", "General")

    if not description or len(description) < 10:
        return jsonify({"suggestion": None}), 200

    try:
        prompt = f"""You are helping a citizen write a better civic issue report for municipal workers.

CITIZEN'S DESCRIPTION:
"{description}"

CATEGORY: {category}

Rewrite this into a clear, specific, actionable 2-3 sentence report.
- Keep the same facts, don't invent new ones
- Use plain language
- Make it easy for a municipal worker to understand the exact problem

Return ONLY the rewritten description. No preamble, no quotes, no explanation."""

        response  = gemini.generate_content(prompt)
        suggestion = response.text.strip().strip('"').strip("'").strip()

        # FIX: only reject if suggestion is basically empty or identical word-for-word
        if not suggestion or suggestion.lower() == description.lower():
            return jsonify({"suggestion": None}), 200

        return jsonify({"suggestion": suggestion})

    except Exception as e:
        print(f"RAG describe error: {e}")
        return jsonify({"suggestion": None}), 200

if __name__ == "__main__":
    app.run(port=8000, debug=True)


# ──────────────────────────────────────────────
# RAG ENDPOINT: Resolution suggestion for crew
# ──────────────────────────────────────────────

