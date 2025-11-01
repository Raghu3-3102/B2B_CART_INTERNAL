import mongoose from "mongoose";

const termSchema = new mongoose.Schema({
  termName: { type: String, required: true },
  baseAmount: { type: Number, required: true },
  gstPercentage: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  termTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  }
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    currency: {
      type: String,
      required: true,
      enum: ["INR", "USD", "EUR", "Other"]
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

    gstNumber: {
      type: String,
      required: function () {
        return this.currency === "INR"; // ✅ GST required only for INR
      }
    },

    standard: { type: String },
    baseClosureAmount: { type: Number, required: true },
    moneyReceived: { type: Number, default: 0 },

    paymentInstallments: { type: Number, default: 1 },

    terms: [termSchema], // ✅ Payment terms array (multi installments)

      attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String }
      }
    ],

  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
