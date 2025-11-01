// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel/AdminModel.js";
import User from "../models/UserModel/UserModel.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token, authorization denied", success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === "admin") user = await Admin.findById(decoded.id).select("-password");
    else user = await User.findById(decoded.id).select("-userPassword");

    if (!user) return res.status(404).json({ message: "User not found", success: false });

    req.user = user;
    req.role = decoded.role;
    req.accessPages = decoded.accessPermissionPages;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};
