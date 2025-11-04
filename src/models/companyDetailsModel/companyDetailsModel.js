import mongoose from "mongoose";

const companyDetailsSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },

    email: { type: String, required: true },
    phone: { type: String, required: true },

    gstNumber: { type: String, required: true },

    bankDetails: {
      bankName: { type: String, required: true },
      beneficiaryName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      swiftCode: { type: String },
      branchAddress: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("CompanyDetails", companyDetailsSchema);
