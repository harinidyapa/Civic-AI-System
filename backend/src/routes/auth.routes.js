import express from "express";
import {
  register,
  verifyRegistrationOtp,
  login,
  requestOtp,
  verifyOtp,
  requestPasswordReset,
  verifyPasswordReset,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/register/verify", verifyRegistrationOtp);
router.post("/login", login);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", requestPasswordReset);
router.post("/forgot-password/verify", verifyPasswordReset);

router.get(
  "/me",
  protect,
  authorizeRoles("citizen", "admin", "crew"),
  (req, res) => {
    res.status(200).json({
      message: "Access granted",
      user: req.user,
    });
  }
);

router.put(
  "/profile",
  protect,
  authorizeRoles("citizen", "admin", "crew"),
  updateProfile
);

router.put(
  "/change-password",
  protect,
  authorizeRoles("citizen", "admin", "crew"),
  changePassword
);

export default router;
