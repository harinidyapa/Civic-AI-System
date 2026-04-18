import express from "express";
import {
  getAssignedIssues,
  createIssue,
  getAllIssues,
  assignIssue,
  updateIssueStatus,
  getMyIssues,
  getIssueDetail,
  markLogsAsViewed
} from "../controllers/issue.controller.js";
import { getResolutionSuggestion } from "../controllers/rag.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Citizen creates issue
router.post(
  "/",
  protect,
  authorizeRoles("citizen"),
  upload.array("images", 3),
  createIssue
);

router.get("/my", protect, getMyIssues);

router.get(
  "/assigned",
  protect,
  authorizeRoles("crew"),
  getAssignedIssues
);

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllIssues
);

router.get("/:id/detail", protect, getIssueDetail);

// ── RAG: AI resolution suggestion for crew ──
router.get(
  "/:id/rag-suggest",
  protect,
  authorizeRoles("crew"),
  getResolutionSuggestion
);

router.put(
  "/:id/logs/viewed",
  protect,
  authorizeRoles("citizen"),
  markLogsAsViewed
);

router.put(
  "/:id/status",
  protect,
  authorizeRoles("crew"),
  upload.array("evidence", 3),
  updateIssueStatus
);

router.put(
  "/:id/assign",
  protect,
  authorizeRoles("admin"),
  assignIssue
);

export default router;