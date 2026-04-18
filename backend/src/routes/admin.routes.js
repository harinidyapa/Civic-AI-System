import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";

const router = express.Router();

// Get all crew members
router.get("/crews", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const crews = await User.find({ role: "crew" }).select("name email _id");
    res.status(200).json(crews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;