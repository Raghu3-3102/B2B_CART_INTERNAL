import express from "express";
import upload from "../../config/ProfileImageCloudneryConfig.js";
import {
  updateUserProfile,
  changeUserPassword
} from "../../controllers/ProfileController/ProfileController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();

// ✅ Update user profile (name, phone, or profile photo)
router.put(
  "/update/:id",
  authMiddleware,
  upload.single("profilePhoto"), // 👈 Single field for user image
  updateUserProfile
);

// 🔐 Change password route
router.put(
  "/change-password/:id",
  authMiddleware,
  changeUserPassword
);

export default router;
