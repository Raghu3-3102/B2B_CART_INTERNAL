// controllers/AuthController.js
import Admin from "../../models/AdminModel/AdminModel.js";
import User from "../../models/UserModel/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpMail } from "../../service/MailSender.js"; // optional

// Generate JWT token
const generateToken = (id, role, accessPages = []) =>
  jwt.sign({ id, role, accessPermissionPages: accessPages }, process.env.JWT_SECRET, { expiresIn: "30d" });


// =================== REGISTER (Auto Admin) ===================
export const register = async (req, res) => {
  try {
    const { userName, userEmail, userPassword, userPhoneNumber } = req.body;

    if (!userName || !userEmail || !userPassword || !userPhoneNumber) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    // Check existing user
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists", success: false });
    }

    // ✅ Create user (password will auto hash from schema)
    const newUser = await User.create({
      userName,
      userEmail,
      userPassword,
      userPhoneNumber,
      role: "admin", // 👈 auto assign admin role
      accessPermissionPages: ["ALL"], // optional
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      success: true,
      token: generateToken(newUser._id, "admin", "ALL"),
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.userEmail,
        phone: newUser.userPhoneNumber,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


// =================== LOGIN ===================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login
    const admin = await Admin.findOne({ email });
    if (admin && await admin.matchPassword(password)) {
      return res.status(200).json({
        id: admin._id,
        email: admin.email,
        role: "admin",
        accessPermissionPages: "ALL",
        token: generateToken(admin._id, "admin"),
        success: true,
      });
    }

    // User login
    const user = await User.findOne({ userEmail: email });
    if (user && await user.matchPassword(password)) {
      return res.status(200).json({
        id: user._id,
        userName: user.userName,
        email: user.userEmail,
        role: user.role,
        accessPermissionPages: user.accessPermissionPages,
        token: generateToken(user._id, "user", user.accessPermissionPages),
        success: true,
      });
    }

    return res.status(401).json({ message: "Invalid credentials", success: false });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// =================== SEND OTP ===================
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    let user = await Admin.findOne({ email });
    let isAdmin = true;

    if (!user) {
      user = await User.findOne({ userEmail: email });
      isAdmin = false;
    }

    if (!user) return res.status(404).json({ message: "User/Admin not found", success: false });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });
    await sendOtpMail(otp, email,user?.userName);

    res.status(200).json({ message: "OTP sent", success: true });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// =================== VERIFY OTP ===================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    let user = await Admin.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
    if (!user) user = await User.findOne({ userEmail: email, otp, otpExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP", success: false });

    res.status(200).json({ message: "OTP verified, proceed to reset password", success: true });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// =================== RESET PASSWORD ===================
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match", success: false });

    let user = await Admin.findOne({ email });
    let isAdmin = true;
    if (!user) {
      user = await User.findOne({ userEmail: email });
      isAdmin = false;
    }

    if (!user) return res.status(404).json({ message: "User/Admin not found", success: false });

    if (isAdmin) user.password = newPassword;
    else user.userPassword = newPassword;

    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully", success: true });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server Error", success: false });
  }
};
