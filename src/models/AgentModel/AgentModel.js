import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  agentEmail: { type: String, required: true, unique: true },
  agentNumber: { type: String, required: true },

  // CURRENT TARGET
  target: { type: Number, default: 0 },
  targetAchieved: { type: Number, default: 0 },

  InvoiceCount: { type: Number, default: 0 },
  InvoiceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }],

  // ⭐ TARGET HISTORY ⭐
  targetHistory: [
    {
      previousTarget: Number,
      previousAchieved: Number,
      changedAt: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
