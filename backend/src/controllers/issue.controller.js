import Issue from "../models/Issue.model.js";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.model.js";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Citizen creates an issue (with optional image)
 */
export const createIssue = async (req, res, next) => {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  console.log("USER:", req.user);
  try {
    const { title, description, category, lat, lng, address } = req.body;

    if (!title || !description || !category || !lat || !lng) {
      return res.status(400).json({ message: "All fields including location are required" });
    }

    // ── AI fields ──
    let aiCategory = null, aiConfidence = null, aiGeneratedDescription = null;
    let aiSeverityScore = null, is_miscategorized = null;
    let textClassification = null, textSummary = null;
    let urgencyLevel = null, urgencyLabel = null, urgencyKeywords = [];

    // Image analysis using the first image only if provided
    if (req.files && req.files.length > 0) {
      try {
        const file = req.files[0];
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-and-enhance`, {
          image: file.buffer.toString("base64")
        });
        ({ predicted_category: aiCategory, confidence_percent: aiConfidence, enhanced_description: aiGeneratedDescription, severity_score: aiSeverityScore, is_miscategorized } = aiResponse.data);
      } catch (aiError) {
        console.error("AI service error:", aiError.message);
      }
    }

    // Text analysis (always, for description)
    if (description && description.trim().length >= 3) {
      try {
        const textResponse = await axios.post(`${AI_SERVICE_URL}/analyze-text`, {
          text: description
        });
        const { classification, summary, urgency } = textResponse.data;
        textClassification = classification;
        textSummary = summary;
        urgencyLevel = urgency.level;
        urgencyLabel = urgency.label;
        urgencyKeywords = urgency.keywords;
      } catch (textError) {
        console.error("Text analysis error:", textError.message);
      }
    }

    // Upload images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        );
        imageUrls.push(result.secure_url);
      }
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || undefined
      },
      images: imageUrls,
      reportedBy: req.user._id,
      // Computer Vision AI
      aiCategory,
      aiConfidence,
      aiGeneratedDescription,
      aiSeverityScore,
      is_miscategorized,
      // NLP Text Analysis
      textClassification,
      textSummary,
      urgencyLevel,
      urgencyLabel,
      urgencyKeywords,
    });

    // ── Save training data (fire-and-forget, non-blocking) ──
    // Runs AFTER the issue is created so it never delays the response
    if (req.files && req.files.length > 0) {
      _saveTrainingDataAsync({
        imageBuffer: req.files[0].buffer,
        confirmedCategory: category,        // what citizen (possibly edited) submitted
        aiCategory: aiCategory || "Uncategorized",
        confidence: aiConfidence || 0,
        issueId: issue._id.toString()
      });
    }

    res.status(201).json({
      message: "Issue reported successfully",
      issue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fire-and-forget: saves the first image as a training sample.
 * Never throws - errors are just logged so they don't affect the user.
 */
async function _saveTrainingDataAsync({ imageBuffer, confirmedCategory, aiCategory, confidence, issueId }) {
  try {
    await axios.post(`${AI_SERVICE_URL}/save-training-data`, {
      image: imageBuffer.toString("base64"),
      confirmed_category: confirmedCategory,
      ai_category: aiCategory,
      confidence,
      issue_id: issueId
    });
    console.log(`✓ Training data saved for issue ${issueId} [${confirmedCategory}]`);
  } catch (err) {
    // Non-fatal - log and move on
    console.warn(`⚠ Training data save failed for issue ${issueId}:`, err.message);
  }
}

/**
 * Admin views all issues
 */
export const getAllIssues = async (req, res, next) => {
  try {
    const { excludeResolved } = req.query;

    let query = {};
    if (excludeResolved === "true") {
      query.status = { $nin: ["resolved", "rejected"] };
    }

    const issues = await Issue.find(query)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("activityLog.changedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin assigns issue to crew
 */
export const assignIssue = async (req, res, next) => {
  try {
    const { crewId } = req.body;
    const crewUser = await User.findById(crewId);

    if (!crewUser || crewUser.role !== "crew") {
      return res.status(400).json({ message: "Invalid crew member" });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { assignedTo: crewId, status: "assigned" },
      { new: true }
    );

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    res.status(200).json({ message: "Issue assigned successfully", issue });
  } catch (error) {
    next(error);
  }
};

/**
 * Crew updates issue status with mandatory validations
 */
export const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, comment, rejectionReason, crewNote, relatedIssue } = req.body;

    let newStatus = status;
    const hardReasons = ["Duplicate Issue", "Issue Spamming"];
    const softReasons = ["Insufficient Resources", "Specialized Equipment Needed"];

    if (status === "rejected") {
      if (softReasons.includes(rejectionReason)) {
        newStatus = "pending";
        if (!crewNote || crewNote.trim().length === 0) {
          return res.status(400).json({ message: "Crew Note is required for soft rejection" });
        }
      } else if (!hardReasons.includes(rejectionReason)) {
        return res.status(400).json({ message: "Invalid rejection reason" });
      }
    }

    if (status === "in_progress" && (!comment || comment.trim().length === 0)) {
      return res.status(400).json({
        message: "Resolution Plan comment is mandatory for in_progress status"
      });
    }

    if (status === "resolved") {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one proof image is required for resolved status" });
      }
      if (req.files.length > 3) {
        return res.status(400).json({ message: "You can upload up to 3 proof images" });
      }
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (!issue.assignedTo || issue.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not assigned to this issue" });
    }

    let evidenceUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        );
        evidenceUrls.push(result.secure_url);
      }
    }

    const logEntry = {
      status: newStatus,
      changedBy: req.user._id,
      timestamp: new Date(),
      comment: comment || undefined,
      evidenceImages: evidenceUrls.length ? evidenceUrls : undefined,
      rejectionReason: rejectionReason || undefined,
      crewNote: crewNote || undefined,
      relatedIssue: relatedIssue || undefined,
      isViewed: false
    };

    Object.keys(logEntry).forEach(key => logEntry[key] === undefined && delete logEntry[key]);

    if (newStatus === "pending" && softReasons.includes(rejectionReason)) {
      issue.assignedTo = null;
    }

    issue.status = newStatus;
    if (!issue.activityLog) issue.activityLog = [];
    issue.activityLog.push(logEntry);
    await issue.save();

    res.status(200).json({ message: "Issue status updated successfully", issue });
  } catch (error) {
    next(error);
  }
};

export const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    next(error);
  }
};

export const getIssueDetail = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("activityLog.changedBy", "name email role");

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const isCitizen = issue.reportedBy._id.toString() === req.user._id.toString();
    const isCrew = issue.assignedTo && issue.assignedTo._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCitizen && !isCrew && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(issue);
  } catch (error) {
    next(error);
  }
};

export const markLogsAsViewed = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (issue.activityLog) {
      issue.activityLog.forEach(log => { log.isViewed = true; });
      await issue.save();
    }

    res.status(200).json({ message: "Logs marked as viewed" });
  } catch (error) {
    next(error);
  }
};

export const getAssignedIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    next(error);
  }
};