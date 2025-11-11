import mongoose from "mongoose";

/* ======================= TERM SCHEMA ======================= */
const termSchema = new mongoose.Schema({
  termName: { type: String, required: true },
  baseAmount: { type: Number, required: true },

  /** ✅ GST only for INR */
  gstPercentage: {
    type: Number,
    required: function () {
      return this.parent().currency === "INR";
    },
  },

  gstAmount: {
    type: Number,
    required: function () {
      return this.parent().currency === "INR";
    },
  },

  TDSAmount: {
    type: Number,
    required: function () {
      return this.parent().currency === "INR";
    },
  },

  /** ✅ termTotal ALWAYS stored in selected currency */
  termTotal: { type: Number, required: true },

  /** ✅ ONLY for NON-INR currency */
  exchangeRate: {
    type: Number,
    required: function () {
      return this.parent().currency !== "INR";
    },
  },

  totalInINR: {
    type: Number,
    required: function () {
      return this.parent().currency !== "INR";
    },
  },

  /** ✅ Modified - Now Close / Lost also allowed */
  status: {
    type: String,
    enum: [ "Close", "Lost","Active"], // ✅ Updated as requested
    default: "Active",
  },
});

/* ======================= PROFORMA INVOICE SCHEMA ======================= */
const proformaInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },

    currency: {
      type: String,
      required: true,
      enum: ["INR", "USD", "EUR", "Other"],
    },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    companyName: { type: String, required: true },
     companyId:{type:mongoose.Schema.Types.ObjectId,ref:"Company"},
    email: { type: String, required: true },
    alternateEmails: [{ type: String }],
    phone: { type: String },
    country: { type: String },
    city: { type: String },
    address: { type: String },
    website: { type: String },

    componyDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyDetails",
    },

    /** ✅ GST NUMBER required only for INR */
    gstNumber: {
      type: String,
      required: function () {
        return this.currency === "INR";
      },
    },

    standard: { type: String },
    baseClosureAmount: { type: Number, required: true },

    /** ❌ Removed moneyReceived as requested */

    paymentInstallments: { type: Number, default: 1 },
    ClientName: { type: String },
    SacCode: { type: String },
    certificationType: { type: String },

    /** ✅ Updated terms */
    terms: [termSchema],

    TotalBaseAmount: { type: Number, required: true },
    TotalGSTAmount: {
      type: Number,
      required: function () {
        return this.currency === "INR";
      },
    },
    TotalTDSAmount: {
      type: Number,
      required: function () {
        return this.currency === "INR";
      },
    },

    GrandTotalBaseAmount: { type: Number, required: true },
    PendingPaymentInINR: { type: Number, required: true },

    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const ProformaInvoice = mongoose.model("ProformaInvoice", proformaInvoiceSchema);
export default ProformaInvoice;
