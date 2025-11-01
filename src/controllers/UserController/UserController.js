// controllers/userController.js
import User from "../../models/UserModel/UserModel.js";


/**
 * 🟢 Create New User (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    const { userName, userEmail, userPassword, userPhoneNumber, role, accessPermissionPages } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    const newUser = new User({
      userName,
      userEmail,
      userPassword,
      userPhoneNumber,
      role,
      accessPermissionPages,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🟣 Get All Users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-userPassword"); // exclude password
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🔵 Get Single User by ID
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-userPassword");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🟠 Update User (Admin can edit)
 */
export const updateUser = async (req, res) => {
  try {
    const { userName,   userPhoneNumber, role, accessPermissionPages } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update fields
    if (userName) user.userName = userName;
    // if (userEmail) user.userEmail = userEmail; If email update is allowed, uncomment this line and extract from req.body
    if (userPhoneNumber) user.userPhoneNumber = userPhoneNumber;
    if (role) user.role = role;
    if (accessPermissionPages) user.accessPermissionPages = accessPermissionPages;

    // If password is updated, hash it automatically (handled by pre-save)
    // if (userPassword) user.userPassword = userPassword; if password update is allowed, uncomment this line and extract from req.body

    await user.save();
    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🔴 Delete User
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
