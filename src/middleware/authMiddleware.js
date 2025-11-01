import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel/AdminModel.js";
import User from "../models/UserModel/UserModel.js";
// import Employee from "../../models/EmployeeModel/EmployeeModel.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied", success: false });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, "Raghu"); // replace with process.env.JWT_SECRET

      let user;

      // Check role and fetch corresponding user
      if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id).select("-password");
      } else {
        user = await User.findById(decoded.id).select("-password");
      }

      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }

      req.user = user;
      req.role = decoded.role;
      next(); // proceed
    } catch (error) {
      console.error("Invalid Token:", error);
      return res.status(401).json({ message: "Invalid or expired token", success: false });
    }
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};
