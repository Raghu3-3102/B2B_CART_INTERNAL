import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    dateOfRegistration: { type: Date, required: true },
    certificationExpiryDate: { type: Date, required: true },
    scopeOfWork: { type: String },
    clientName: { type: String },
    standard: { type: String },
    email: { type: String },
    // ✅ Optional company contact fields
    alternateEmails: {
         type: [String],    // Array of strings
         required: false,   // Not mandatory
         default: []        // Optional: initialize with empty array
        },

    companyPhoneCode: { type: String, required: false, trim: true }, // "+91"
    companyPhoneNumber: { type: String, required: false, trim: true }, // "9876543210"


    country: { type: String, required: true },
    city: { type: String, required: true },

    firstSurveillanceAudit: { type: Date },
    firstSurveillanceStatus: {
      type: String,
      enum: ["Completed", "Pending"],
      default: "Pending"
    },
    firstSurveillanceNotes: { type: String, default: "" },

    secondSurveillanceAudit: { type: Date },
    secondSurveillanceStatus: {
      type: String,
      enum: ["Completed", "Pending"],
      default: "Pending"
    },
    secondSurveillanceNotes: { type: String, default: "" },

    certificationNumber: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Pending"
    },

    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String }
      }
    ],

    logo: { type: String },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent"
    },
    assigendVendor:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor"
    }

  },
  { timestamps: true }
);

const Certification = mongoose.model("Certification", certificationSchema);
export default Certification;
