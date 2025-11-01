import User from "../../models/UserModel/UserModel.js";
import bcrypt from "bcryptjs";

// ✏️ Update user profile (edit name, phone number, or upload profile photo)
export const updateUserProfile = async (req, res) => {
  try {
    const { userName, userPhoneNumber } = req.body;
    const profilePhoto = req.file ? req.file.path : null;

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Update only the fields that are provided
    if (userName && userName.trim() !== "") user.userName = userName;
    if (userPhoneNumber && userPhoneNumber.trim() !== "")
      user.userPhoneNumber = userPhoneNumber;
    if (profilePhoto) user.profilePhoto = profilePhoto; // handle image-only case

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        userName: updatedUser.userName,
        userEmail: updatedUser.userEmail,
        userPhoneNumber: updatedUser.userPhoneNumber,
        profilePhoto: updatedUser.profilePhoto,
      },
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};

// 🔐 Change password (verify old password before updating)
// 🔐 Change password (verify old password before updating)
export const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Incorrect old password" });

    user.userPassword = newPassword; // ✅ Directly assign new password
    await user.save(); // ✅ Hashing happens automatically in pre("save")

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
      error: error.message,
    });
  }
};
