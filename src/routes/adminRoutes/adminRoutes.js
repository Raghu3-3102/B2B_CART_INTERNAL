import express from "express";
import {
  registerAdmin,
  loginAdmin,
  sendOTP,
  verifyOTP,
  changePassword,
} from "../../controllers/adminController/adminController.js";

const router = express.Router();

// Register & Login
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Forgot Password
router.post("/forgot/send-otp", sendOTP);
router.post("/forgot/verify-otp", verifyOTP);
router.post("/forgot/change-password", changePassword);

export default router;
