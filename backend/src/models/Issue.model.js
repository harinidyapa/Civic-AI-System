import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "resolved", "rejected"],
      default: "pending"
    },
    severityScore: {
      type: Number,
      default: 1
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    // Computer Vision AI Analysis
    aiCategory: String,
    aiConfidence: Number,
    aiGeneratedDescription: String,
    aiSeverityScore: Number,
    is_miscategorized: Boolean,
    // NLP Text Analysis
    textClassification: {
      category: String,
      confidence: Number
    },
    textSummary: String,
    urgencyLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    urgencyLabel: String,
    urgencyKeywords: [String],
    // Activity log for tracking lifecycle events
    activityLog: [
      {
        status: {
          type: String,
          enum: ["pending", "assigned", "in_progress", "resolved", "rejected"],
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        comment: String, // For in_progress: Resolution Plan or general notes
        evidenceImages: [String], // can contain multiple proof images
        rejectionReason: String, // reason for rejection when status is rejected
        crewNote: String, // note returned to pool on soft rejection
        relatedIssue: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Issue",
        },
        isViewed: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Issue", issueSchema);
