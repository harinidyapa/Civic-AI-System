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
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import multer from "multer";

const router = express.Router();

// Multer config to handle image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Citizen creates issue with up to 3 images
router.post(
  "/",
  protect,
  authorizeRoles("citizen"),
  upload.array("images", 3),
  createIssue
);

// GET routes (must come before /:id routes to avoid conflicts)
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

// Routes with :id path parameter
router.get("/:id/detail", protect, getIssueDetail);

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