import mongoose from "mongoose";

const standardSchema = new mongoose.Schema(
  {
    standardName: { type: String, required: true, unique: true },
    description: { type: String }
  },
  { timestamps: true }
);

const Standard = mongoose.model("Standard", standardSchema);
export default Standard;
