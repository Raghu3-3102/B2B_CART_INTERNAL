import Agent from "../../models/AgentModel/AgentModel.js";
import Certification from "../../models/CertificationModel/CertificationModel.js";

// ✅ Create Agent
export const createAgent = async (req, res) => {
  try {
    const { agentName, agentEmail, agentNumber } = req.body;
    const existingAgent = await Agent.findOne({ agentEmail });
    if (existingAgent) {
      return res
        .status(400)
        .json({ message: "Agent with this email already exists", success: false });
    }

    const agent = new Agent({ agentName, agentEmail, agentNumber });
    await agent.save();
    res.status(201).json({ message: "Agent created successfully", agent, success: true });
  } catch (error) {
    console.error("Error in createAgent:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ✅ Get All Agents (with Pagination)
export const getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const agents = await Agent.find().skip(skip).limit(limit);
    const totalAgents = await Agent.countDocuments();

    res.status(200).json({
      success: true,
      agents,
      currentPage: page,
      totalPages: Math.ceil(totalAgents / limit),
      totalAgents,
    });
  } catch (error) {
    console.error("Error in getAllAgents:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ✅ Get Agent by ID
export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found", success: false });
    }
    res.status(200).json({ agent, success: true });
  } catch (error) {
    console.error("Error in getAgentById:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ✅ Update Agent
export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentName, agentEmail, agentNumber } = req.body;

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { agentName, agentEmail, agentNumber },
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ message: "Agent not found", success: false });
    }

    res.status(200).json({ message: "Agent updated successfully", updatedAgent, success: true });
  } catch (error) {
    console.error("Error in updateAgent:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ✅ Delete Agent + Remove Agent ID from Certifications
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if agent exists
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found", success: false });
    }

    // Remove agent from certifications
    await Certification.updateMany(
      { assignedAgent: id },
      { $unset: { assignedAgent: "" } }
    );

    // Delete agent
    await Agent.findByIdAndDelete(id);

    res.status(200).json({ message: "Agent deleted and removed from certifications", success: true });
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};
