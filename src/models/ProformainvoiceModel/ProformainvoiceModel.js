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

   BankingCharges: {
    type: Number,
    required: function () {
      return this.parent().currency !== "INR";
    },
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
    /** ✅ Modified - Now Close / Lost also allowed */
  status: {
    type: String,
    enum: [ "Close", "Lost","Active"], // ✅ Updated as requested
    default: "Active",
  },
    email: { type: String, required: true },
    alternateEmails: [{ type: String }],
    phone: { type: String },
    country: { type: String },
    city: { type: String },
    address: { type: String },
    website: { type: String },
    proformaInvoiceDate: { type: Date, default: Date.now },

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

    standard: { type: [String], ref: "Standard" },
    baseClosureAmount: { type: Number, required: true },

    /** ❌ Removed moneyReceived as requested */

    paymentInstallments: { type: Number, default: 1 },
    ClientName: { type: String },
    SacCode: { type: String },
    certificationType: { type: String },

    /** ✅ Updated terms */
    terms: [termSchema],

    
  },
  { timestamps: true }
);

const ProformaInvoice = mongoose.model("ProformaInvoice", proformaInvoiceSchema);
export default ProformaInvoice;
