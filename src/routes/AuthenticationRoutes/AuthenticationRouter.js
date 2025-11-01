import express from "express";
import { login, sendOTP, verifyOTP, resetPassword,register } from "../../controllers/AuthenticationController/AuthenticationController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();

//  Routes for Authentication
router.post("/register", register);

// Login for Admin/User
router.post("/login", login);

// Forgot / Reset Password
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Protected admin-only route
// router.post("/create-user", authMiddleware, (req, res, next) => {
//   if (req.role !== "admin") return res.status(403).json({ message: "Access denied" });
//   next();
// }, (req, res) => { res.send("User Created"); });

export default router;
