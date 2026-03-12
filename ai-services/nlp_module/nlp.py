import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Issue categories
ISSUE_CATEGORIES = [
    "Pothole",
    "Garbage",
    "Streetlight",
    "Water Leakage",
    "Traffic Congestion",
    "Broken Pole",
    "Drainage Issue",
    "Uncategorized"
]

# Urgency keywords — kept local, no API needed
URGENCY_KEYWORDS = {
    5: ["sparking", "fire", "explosion", "danger", "critical", "emergency", "blocking road", "accident", "injury", "dangerous"],
    4: ["leaking water", "flooding", "broken pole", "no light", "fallen", "disconnected", "exposed wire", "hazard"],
    3: ["broken", "damaged", "cracked", "holes", "stuck", "not working", "leaking", "dirty", "pothole", "hole"],
    2: ["dirty", "dust", "minor", "small", "little"],
    1: ["report", "issue", "complaint"]
}


def classify_text(text):
    """
    Classify complaint text into issue categories using Gemini.
    Returns: (category, confidence)
    """
    if not text or len(text.strip()) < 3:
        return "Uncategorized", 0.0

    try:
        prompt = f"""You are a smart city issue classifier.
Classify the following complaint into exactly ONE of these categories:
{', '.join(ISSUE_CATEGORIES)}

Complaint: "{text}"

Reply in this EXACT format only:
CATEGORY: <category name>
CONFIDENCE: <number between 0 and 1>

Nothing else."""

        response = model.generate_content(prompt)
        result = response.text.strip()

        category = "Uncategorized"
        confidence = 0.5

        for line in result.split("\n"):
            line = line.strip()
            if line.startswith("CATEGORY:"):
                cat = line.replace("CATEGORY:", "").strip()
                if cat in ISSUE_CATEGORIES:
                    category = cat
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except ValueError:
                    confidence = 0.5

        return category, round(confidence, 4)

    except Exception as e:
        print(f"Gemini classify_text error: {e}")
        return "Uncategorized", 0.0


def summarize_text(text, max_length=50, min_length=20):
    """
    Summarize complaint text into a concise civic one-liner using Gemini.
    Returns: summary (string)
    """
    if not text or len(text.strip()) < 10:
        return text[:100]

    try:
        prompt = f"""Summarize the following civic complaint in one clear sentence (max 40 words).
Use formal civic language. Do not add opinions.

Complaint: "{text}"

Reply with just the summary sentence, nothing else."""

        response = model.generate_content(prompt)
        summary = response.text.strip().strip('"').strip("'")
        return summary if summary else text[:100]

    except Exception as e:
        print(f"Gemini summarize_text error: {e}")
        sentences = text.split('.')
        return (sentences[0] + '.').strip() if sentences else text[:100]


def detect_urgency(text):
    """
    Detect urgency level from complaint text using keywords.
    Returns: (urgency_level: 1-5, urgency_label: str, keywords_found: list)
    """
    if not text:
        return 1, "Very Low", []

    text_lower = text.lower()
    max_urgency = 1
    keywords_found = []

    for urgency_level in sorted(URGENCY_KEYWORDS.keys(), reverse=True):
        for keyword in URGENCY_KEYWORDS[urgency_level]:
            if keyword in text_lower:
                keywords_found.append(keyword)
                max_urgency = max(max_urgency, urgency_level)

    urgency_labels = {
        5: "Critical",
        4: "High",
        3: "Medium",
        2: "Low",
        1: "Very Low"
    }

    return max_urgency, urgency_labels[max_urgency], list(set(keywords_found))


def generate_description(category):
    """
    Generate a civic description for a detected issue category using Gemini.
    Returns: description (string)
    """
    if not category or category == "Uncategorized":
        return "A civic issue has been reported and requires attention."

    try:
        prompt = f"""Write one short factual civic report sentence (max 40 words) about a {category} issue 
reported in a city. Use formal language suitable for a municipal complaint system.
Reply with just the sentence, nothing else."""

        response = model.generate_content(prompt)
        description = response.text.strip().strip('"').strip("'")
        return description if description else f"A {category} issue has been reported and requires immediate attention."

    except Exception as e:
        print(f"Gemini generate_description error: {e}")
        return f"A {category} issue has been reported and requires immediate attention."


def analyze_text_comprehensive(text):
    """
    Comprehensive text analysis using a single Gemini call.
    Returns: dict with classification, summary, urgency
    """
    if not text or len(text.strip()) < 3:
        return {
            "classification": {"category": "Uncategorized", "confidence": 0.0},
            "summary": text[:100] if text else "",
            "urgency": {"level": 1, "label": "Very Low", "keywords": []},
            "error": "Text too short for analysis"
        }

    try:
        prompt = f"""You are a smart city complaint analysis system.
Analyze the following civic complaint and provide:
1. Category (choose ONE from: {', '.join(ISSUE_CATEGORIES)})
2. Confidence score (0 to 1)
3. One-line summary (max 40 words, formal civic language)

Complaint: "{text}"

Reply in this EXACT format only:
CATEGORY: <category>
CONFIDENCE: <0.0 to 1.0>
SUMMARY: <one line summary>

Nothing else."""

        response = model.generate_content(prompt)
        result = response.text.strip()

        category = "Uncategorized"
        confidence = 0.5
        summary = text[:100]

        for line in result.split("\n"):
            line = line.strip()
            if line.startswith("CATEGORY:"):
                cat = line.replace("CATEGORY:", "").strip()
                if cat in ISSUE_CATEGORIES:
                    category = cat
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except ValueError:
                    confidence = 0.5
            elif line.startswith("SUMMARY:"):
                summary = line.replace("SUMMARY:", "").strip().strip('"').strip("'")

        # Urgency is always local
        urgency_level, urgency_label, keywords_found = detect_urgency(text)

        return {
            "classification": {"category": category, "confidence": round(confidence, 4)},
            "summary": summary,
            "urgency": {"level": urgency_level, "label": urgency_label, "keywords": keywords_found}
        }

    except Exception as e:
        print(f"Gemini analyze_text_comprehensive error: {e}")
        urgency_level, urgency_label, keywords_found = detect_urgency(text)
        return {
            "classification": {"category": "Uncategorized", "confidence": 0.0},
            "summary": text[:100],
            "urgency": {"level": urgency_level, "label": urgency_label, "keywords": keywords_found},
            "error": str(e)
        }