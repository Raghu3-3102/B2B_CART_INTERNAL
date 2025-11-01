import Agent from "../../models/AgentModel/AgentModel.js";
import Certification from "../../models/individualCertificationModel/individualCertificationModel.js";
import Vendor from "../../models/VendorModel/VendorModel.js";
// ✅ Create Certification
export const createIndividualCertification = async (req, res) => {
  try {
    const {
      companyName,
      address,
      dateOfRegistration,
      certificationExpiryDate,
      scopeOfWork,
      clientName,
      standard,
      email,
      country,
      city,
      certificationNumber,
      status,
      assignedAgent,
      assigendVendor,
      companyPhoneCode,
      companyPhoneNumber,
      alternateEmails,
    } = req.body;

    // Handle uploaded files
    const attachments =
      req.files?.attachments?.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      })) || [];

    const logo = req.files?.logo?.[0]?.path || null;

    // Create certification
    const newCertification = new Certification({
      companyName,
      address,
      dateOfRegistration,
      certificationExpiryDate,
      scopeOfWork,
      clientName,
      standard,
      email,
      country,
      city,
      certificationNumber,
      status,
      assignedAgent,
      assigendVendor,
      attachments,
      logo,
      companyPhoneCode,
      companyPhoneNumber,
      alternateEmails: alternateEmails || [],
    });

    const savedCertificate = await newCertification.save();

    // Update Agent
    if (assignedAgent) {
      const agent = await Agent.findById(assignedAgent);
      if (agent) {
        agent.companyCount = (agent.companyCount || 0) + 1;
        agent.IndividualsId = [...(agent.IndividualsId || []), savedCertificate._id];
        await agent.save();
      }
    }
    // Update Vendor
    if (assigendVendor) {    
      const vendor = await Vendor.findById(assigendVendor);
      if (vendor) {
        vendor.companyCount = (vendor.companyCount || 0) + 1;
        vendor.individualsId = [...(vendor.individualsId || []), savedCertificate._id];
        await vendor.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Certification created successfully!",
      certification: savedCertificate,
    });
  } catch (error) {
    console.error("❌ Error creating certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating certification",
      error: error.message,
    });
  }
};



// ✅ Get All Certifications
export const getAllIndividualCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find().populate("assignedAgent").populate("assigendVendor");
    res.status(200).json({
      success: true,
      count: certifications.length,
      certifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching certifications",
      error: error.message,
    });
  }
};



// ✅ Get Certification by ID
export const getIndividualCertificationById = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id).populate("assignedAgent").populate("assigendVendor");
    if (!certification) {
      return res.status(404).json({ success: false, message: "Certification not found" });
    }
    res.status(200).json({ success: true, certification });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching certification",
      error: error.message,
    });
  }
};



// ✅ Update Certification
// ✅ Update Certification
export const updateIndividualCertification = async (req, res) => {
  try {
    const { assignedAgent, assigenedVendor } = req.body; // <-- Vendor also destructured
    const certificationId = req.params.id;

    const existingCertification = await Certification.findById(certificationId);
    if (!existingCertification) {
      return res.status(404).json({ success: false, message: "Certification not found" });
    }

    // ✅ Handle updated files
    const attachments =
      req.files?.attachments?.length > 0
        ? req.files.attachments.map((file) => ({
            fileName: file.originalname,
            fileUrl: file.path,
            fileType: file.mimetype,
          }))
        : existingCertification.attachments;

    const logo = req.files?.logo?.[0]?.path || existingCertification.logo;

    // ✅ Update Certification
    const updatedCertification = await Certification.findByIdAndUpdate(
      certificationId,
      { ...req.body, attachments, logo },
      { new: true }
    );

    /* -----------------------------------------
          🚀 AGENT UPDATE LOGIC (Already Correct)
       ------------------------------------------*/
    if (assignedAgent && String(existingCertification.assignedAgent) !== String(assignedAgent)) {
      const oldAgent = await Agent.findById(existingCertification.assignedAgent);
      if (oldAgent) {
        oldAgent.IndividualsId = oldAgent.IndividualsId.filter(
          (id) => String(id) !== String(certificationId)
        );
        oldAgent.companyCount = Math.max(0, (oldAgent.companyCount || 1) - 1);
        await oldAgent.save();
      }

      const newAgent = await Agent.findById(assignedAgent);
      if (newAgent) {
        newAgent.IndividualsId = [...(newAgent.IndividualsId || []), certificationId];
        newAgent.companyCount = (newAgent.companyCount || 0) + 1;
        await newAgent.save();
      }
    }

    /* -----------------------------------------
          ✅ NEW: VENDOR UPDATE LOGIC (Same as Agent)
       ------------------------------------------*/
    if (assigenedVendor && String(existingCertification.assigenedVendor) !== String(assigenedVendor)) {
      const oldVendor = await Vendor.findById(existingCertification.assigenedVendor);
      if (oldVendor) {
        oldVendor.individualsId = oldVendor.individualsId.filter(
          (id) => String(id) !== String(certificationId)
        );
        oldVendor.companyCount = Math.max(0, (oldVendor.companyCount || 1) - 1);
        await oldVendor.save();
      }

      const newVendor = await Vendor.findById(assigenedVendor);
      if (newVendor) {
        newVendor.individualsId = [...(newVendor.individualsId || []), certificationId];
        newVendor.companyCount = (newVendor.companyCount || 0) + 1;
        await newVendor.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Certification updated successfully!",
      certification: updatedCertification,
    });

  } catch (error) {
    console.error("❌ Error updating certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating certification",
      error: error.message,
    });
  }
};




// ✅ Delete Certification
export const deleteIndividualCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ success: false, message: "Certification not found" });
    }

    // Remove from Agent’s IndividualsId list
    if (certification.assignedAgent) {
      const agent = await Agent.findById(certification.assignedAgent);
      if (agent) {
        agent.IndividualsId = agent.IndividualsId.filter(
          (id) => String(id) !== String(certification._id)
        );
        agent.companyCount = Math.max(0, (agent.companyCount || 1) - 1);
        await agent.save();
      }
    }
    // Remove from Vendor’s individualsId list
    if (certification.assigenedVendor) {
      const vendor = await Vendor.findById(certification.assigenedVendor);
      if (vendor) {
        vendor.individualsId = vendor.individualsId.filter(
          (id) => String(id) !== String(certification._id)
        );
        vendor.companyCount = Math.max(0, (vendor.companyCount || 1) - 1);
        await vendor.save();
      }
    }

    await Certification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting certification",
      error: error.message,
    });
  }
};
