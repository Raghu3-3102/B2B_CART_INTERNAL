import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    vendorEmail: { type: String, required: true, unique: true },
    vendorNumber: { type: String, required: true },
    companyCount: { type: Number, default: 0 },
    companyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
    individualsId: [
      { type: mongoose.Schema.Types.ObjectId, ref: "IndividualCertification" }
    ],
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
