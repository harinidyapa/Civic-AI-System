import express from "express";
import {
  analyzeComplaintText,
  classifyComplaintText,
  summarizeComplaintText,
  detectComplaintUrgency,
  batchAnalyzeText,
  nlpStatus
} from "../controllers/nlp.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public NLP endpoints (accessible to authenticated users)
router.post("/analyze", protect, analyzeComplaintText);
router.post("/classify", protect, classifyComplaintText);
router.post("/summarize", protect, summarizeComplaintText);
router.post("/urgency", protect, detectComplaintUrgency);

// Batch analysis (admin only)
router.post("/batch", protect, authorizeRoles("admin"), batchAnalyzeText);

// Status endpoint (public)
router.get("/status", nlpStatus);

export default router;
