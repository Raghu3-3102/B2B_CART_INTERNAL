import mongoose from "mongoose";

// ======================= TERM SCHEMA =======================
const termSchema = new mongoose.Schema({
  termName: { type: String, required: true },
  baseAmount: { type: Number, required: true },

  /** ✅ GST only for INR */
 
  gstPercentage: {
    type: Number,
    default: 18,
    required: function () {
      return this.parent().currency === "INR";
    },
  },
  gstAmount: {
    type: Number,
    default: 0,
    required: function () {
      return this.parent().currency === "INR";
    },
  },
     TDSAmmount: {
    type: Number,
    default: 18,
    required: function () {
      return this.parent().currency === "INR";
    },
  },

  /** ✅ termTotal ALWAYS stores in selected currency (INR / USD / EUR) */
  termTotal: { type: Number, required: true },

  /** ✅ ONLY when currency is NON-INR (USD/EUR/Other) */
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

  status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
});



// ======================= INVOICE SCHEMA =======================
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },

    currency: {
      type: String,
      required: true,
      enum: ["INR", "USD", "EUR", "Other"],
    },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    companyName: { type: String, required: true },
    email: { type: String, required: true },
    alternateEmails: [{ type: String }],
    phone: { type: String },
    country: { type: String },
    city: { type: String },
    address: { type: String },
    website: { type: String },

    /** ✅ GST NUMBER required only for INR */
    gstNumber: {
      type: String,
      required: function () {
        return this.currency === "INR";
      },
    },

    standard: { type: String },
    baseClosureAmount: { type: Number, required: true },
    moneyReceived: { type: Number, default: 0 },
    paymentInstallments: { type: Number, default: 1 },

    /** ✅ Multi installment terms */
    terms: [termSchema],

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

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
