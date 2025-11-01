import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  agentEmail: { type: String, required: true, unique: true },
  agentNumber: { type: String, required: true },
  companyCount: { type: Number, default: 0 },       // optional
  companyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }], // optional
  IndividualsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "IndividualCertification" }], // optional
}, { timestamps: true });

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
