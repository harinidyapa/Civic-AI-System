import Issue from "../models/Issue.model.js";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * RAG-based resolution suggestion for crew.
 * 
 * 1. Fetches top 3 similar RESOLVED issues from MongoDB (same category)
 * 2. Extracts their resolution comments from activityLog
 * 3. Sends to AI service /rag-suggest with current issue + past context
 * 4. Returns AI-generated step-by-step resolution guide
 */
export const getResolutionSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the current issue
    const currentIssue = await Issue.findById(id);
    if (!currentIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // ── RAG: Retrieve similar resolved issues ──
    // Match by same category, must be resolved, exclude current issue
    const similarIssues = await Issue.find({
      _id: { $ne: id },
      category: currentIssue.category,
      status: "resolved",
      // Only include issues that have resolution comments in activityLog
      "activityLog.status": "resolved"
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    // Extract resolution comments from activityLog
    const formattedSimilar = similarIssues.map(issue => {
      // Find the in_progress log entry (has resolution plan comment)
      const inProgressLog = issue.activityLog?.find(
        log => log.status === "in_progress" && log.comment
      );
      // Find resolved log entry
      const resolvedLog = issue.activityLog?.find(
        log => log.status === "resolved"
      );

      return {
        title: issue.title,
        category: issue.category,
        description: issue.description,
        resolution_comment: inProgressLog?.comment || resolvedLog?.comment || "Resolved successfully"
      };
    });

    // ── Augment: Send to Gemini via AI service ──
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/rag-suggest`, {
      current_issue: {
        title: currentIssue.title,
        description: currentIssue.description,
        category: currentIssue.category,
        urgencyLabel: currentIssue.urgencyLabel || "Medium"
      },
      similar_issues: formattedSimilar
    });

    return res.status(200).json({
      suggestion: aiResponse.data,
      similar_count: formattedSimilar.length,
      similar_issues: formattedSimilar.map(i => ({ title: i.title, category: i.category }))
    });

  } catch (error) {
    console.error("❌ RAG suggestion error:", error.message);
    if (error.response?.data) {
      console.error("   Response from AI service:", error.response.data);
    }
    if (error.code === "ECONNREFUSED") {
      console.error(`\n⚠️  CRITICAL: Cannot connect to AI Service at ${AI_SERVICE_URL}`);
      console.error("   Please ensure:");
      console.error("   1. Navigate to ai-services folder: cd ai-services");
      console.error("   2. Run: python app.py");
      console.error("   3. Check that Flask server starts on port 8000\n");
    }
    // Non-fatal — return empty suggestion rather than crashing
    return res.status(200).json({
      suggestion: null,
      similar_count: 0,
      error: error.code === "ECONNREFUSED" 
        ? `AI service unreachable at ${AI_SERVICE_URL}. Check if Flask app is running.`
        : error.message || "Could not generate suggestion at this time"
    });
  }
};