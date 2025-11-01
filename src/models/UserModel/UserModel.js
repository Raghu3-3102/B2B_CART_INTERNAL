import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userPassword: {
      type: String,
      required: true,
      minlength: 6,
    },
    userPhoneNumber: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "editor"],
      default: "editor",
    },
    accessPermissionPages: {
      type: [String],
      default: [],
    },
    profilePhoto: {
      type: String, // file path or URL
      required: false,
    },
    otp: String,
    otpExpire: Date,
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("userPassword")) return next();
  const salt = await bcrypt.genSalt(10);
  this.userPassword = await bcrypt.hash(this.userPassword, salt);
  next();
});

// 🔑 Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.userPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
