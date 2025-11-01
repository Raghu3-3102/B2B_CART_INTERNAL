import Admin from "../../models/AdminModel/AdminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpMail } from "../../service/MailSender.js";
import nodemailer from "nodemailer";

// Generate JWT token
const generateToken = (id) => jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "30d" });
console.log("JWT Secret:", process.env.JWT_SECRET);
// 🧾 Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists", success: false });
    }

    const admin = await Admin.create({ email, password });

    res.status(201).json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
      success: true,
    });
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


// 🔐 Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        _id: admin._id,
        email: admin.email,
        token: generateToken(admin._id),
        success: true,
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password", success: false });
    }
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


// Step 1: Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found", success: false });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await admin.save({ validateBeforeSave: false });

      // Send OTP by email
     const flag = sendOtpMail(otp,admin.email)
     if (flag) {
       res.json({ message: "OTP sent to email", success: true });
     }else{
      res.status(500).json({ message: "Server Error", success: false });
     }

    

    


   
  } catch (error) {
    console.error("Error in sendOTP:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP", success: false });
    }

    res.json({ message: "OTP verified, proceed to change password", success: true });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


// Step 3: Change Password
export const changePassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match", success: false });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found", success: false });
    }

    admin.password = password; // pre-save hook will hash automatically
    admin.otp = undefined;
    admin.otpExpire = undefined;

    await admin.save();

    res.json({ message: "Password changed successfully", success: true });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};


