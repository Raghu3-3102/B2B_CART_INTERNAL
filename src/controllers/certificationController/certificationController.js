
// ✅ Create Certification Controller
import Agent from "../../models/AgentModel/AgentModel.js";
import Certification from "../../models/CertificationModel/CertificationModel.js";
import Company from "../../models/componyModel/ComponyModel.js";
import IndividualCertification from "../../models/individualCertificationModel/individualCertificationModel.js";
import Vendor from "../../models/VendorModel/VendorModel.js";

export const createCertification = async (req, res) => {
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
      firstSurveillanceAudit,
      secondSurveillanceAudit,
      certificationNumber,
      status,
      assignedAgent,
      assigendVendor,
      firstSurveillanceStatus,
      firstSurveillanceNotes,
      secondSurveillanceStatus,
      secondSurveillanceNotes,
      companyPhoneCode,
      companyPhoneNumber,
      alternateEmails, // ✅ Add this
    } = req.body;

    // Handle uploaded attachments
    const attachments =
      req.files?.attachments?.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      })) || [];

    // Handle uploaded logo
    const logo = req.files?.logo?.[0]?.path || null;

    // Create and save Certification
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
      firstSurveillanceAudit,
      secondSurveillanceAudit,
      certificationNumber,
      status,
      assignedAgent,
      assigendVendor,
      attachments,
      logo,
      firstSurveillanceStatus,
      firstSurveillanceNotes,
      secondSurveillanceStatus,
      secondSurveillanceNotes,
      companyPhoneCode,
      companyPhoneNumber,
      alternateEmails: alternateEmails || [], // ✅ Store in Certification
    });

    const savedCertificate = await newCertification.save();

    // Update Agent data
    const agentData = await Agent.findById(assignedAgent);
    if (agentData) {
      agentData.companyCount = (agentData.companyCount || 0) + 1;
      agentData.companyIds = [...(agentData.companyIds || []), savedCertificate._id];
      await agentData.save();
    }

    // Update Vendor data
    const vendorData = await Vendor.findById(assigendVendor);
    if (vendorData) {
      vendorData.companyCount = (vendorData.companyCount || 0) + 1;
      vendorData.companyIds = [...(vendorData.companyIds || []), savedCertificate._id];
      await vendorData.save();
    }

    // Create or Update Company data
    let existingCompany = await Company.findOne({ companyName });

    if (existingCompany) {
      existingCompany.certificationIds.push(savedCertificate._id);
      existingCompany.certificationCount = existingCompany.certificationIds.length;
      existingCompany.address = address || existingCompany.address;
      existingCompany.logo = logo || existingCompany.logo;
      existingCompany.clientName = clientName || existingCompany.clientName;
      existingCompany.country = country || existingCompany.country;
      existingCompany.city = city || existingCompany.city;
      existingCompany.companyEmail = email || existingCompany.companyEmail;
      existingCompany.companyPhoneCode = companyPhoneCode || existingCompany.companyPhoneCode;
      existingCompany.companyPhoneNumber = companyPhoneNumber || existingCompany.companyPhoneNumber;
      existingCompany.alternateEmails = alternateEmails || existingCompany.alternateEmails; // ✅ Store in Company
      await existingCompany.save();
    } else {
      const newCompany = new Company({
        companyName,
        address,
        logo,
        status: "Active",
        certificationCount: 1,
        certificationIds: [savedCertificate._id],
        clientName,
        country,
        city,
        companyEmail: email,
        companyPhoneCode,
        companyPhoneNumber,
        alternateEmails: alternateEmails || [], // ✅ Store in Company
      });
      await newCompany.save();
    }

    res.status(201).json({
      success: true,
      message: "Certification and Company created/updated successfully!",
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






// ✅ Get all certifications with assignedAgent details and pagination

export const getAllCertification = async (req, res) => {
  try {
    // Pagination parameters
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch certifications with pagination
    const certifications = await Certification.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Attach agent + vendor info for each certification
    const certificationsWithDetails = await Promise.all(
      certifications.map(async cert => {
        let agentInfo = null;
        let vendorInfo = null;

        // 🔹 Fetch agent info if exists
        if (cert.assignedAgent) {
          agentInfo = await Agent.findById(cert.assignedAgent)
            .select("agentName agentEmail agentPhoneNumber") // only fields needed
            .lean();
        }

        // 🔹 Fetch vendor info if exists
        if (cert.assigendVendor) {
          vendorInfo = await Vendor.findById(cert.assigendVendor)
            .select("vendorName vendorEmail vendorNumber companyCount companyIds")
            .lean();
        }

        return {
          ...cert.toObject(),
          assignedAgentInfo: agentInfo,
          assignedVendorInfo: vendorInfo,  // ✅ Added vendor details
        };
      })
    );

    // Total count for pagination
    const total = await Certification.countDocuments();

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      certifications: certificationsWithDetails,
    });

  } catch (error) {
    console.error("Error fetching certifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certifications",
      error: error.message,
    });
  }
};


export const getCertificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const certification = await Certification.findById(id).populate({
        path: "assignedAgent",
        select: "agentName agentEmail agentPhoneNumber"
      })
      .populate({
        path: "assigendVendor",
        select: "vendorName vendorEmail vendorNumber companyCount companyIds"
      });;

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Certification fetched successfully!",
      certification,
    });
  } catch (error) {
    console.error("Error fetching certification by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certification by ID",
      error: error.message,
    });
  }
};


// export const updateCertification = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(req.body)
//     const updatedCertification = await Certification.findByIdAndUpdate(
//       id,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );

//     if (!updatedCertification) {
//       return res.status(404).json({
//         success: false,
//         message: "Certification not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Certification updated successfully!",
//       certification: updatedCertification,
//     });
//   } catch (error) {
//     console.error("Error updating certification:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating certification",
//       error: error.message,
//     });
//   }
// };
// export const updateCertification = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // ✅ Find the existing certification first
//     const certification = await Certification.findById(id);
//     if (!certification) {
//       return res.status(404).json({ success: false, message: "Certification not found" });
//     }

//     // ✅ Update attachments if new ones uploaded
//     if (req.files?.attachments) {
//       const newAttachments = req.files.attachments.map(file => ({
//         fileName: file.originalname,
//         fileUrl: file.path,
//         fileType: file.mimetype,
//       }));
//       // Merge with existing attachments or replace entirely
//       certification.attachments = [...(certification.attachments || []), ...newAttachments];
//     }

//     // ✅ Update logo if new one uploaded
//     if (req.files?.logo?.[0]) {
//       certification.logo = req.files.logo[0].path;
//     }

//     // ✅ Update other fields from req.body
//     Object.keys(req.body).forEach(key => {
//       certification[key] = req.body[key];
//     });

//     const updatedCertification = await certification.save();

//     res.status(200).json({
//       success: true,
//       message: "Certification updated successfully!",
//       certification: updatedCertification,
//     });
//   } catch (error) {
//     console.error("Error updating certification:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating certification",
//       error: error.message,
//     });
//   }
// };
export const updateCertification = async (req, res) => {
  try {
    const certificationId = req.params.id;

    // Fetch existing certification
    const existing = await Certification.findById(certificationId);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Certification not found" });
    }

    // Handle new attachments (if any)
    let newAttachments = [];
    if (req.files?.attachments && req.files.attachments.length > 0) {
      newAttachments = req.files.attachments.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      }));
    }

    // Merge old + new attachments
    const mergedAttachments = [...existing.attachments, ...newAttachments];

    // Build updated data
    const updatedData = {
      companyName: req.body.companyName,
      address: req.body.address,
      dateOfRegistration: req.body.dateOfRegistration,
      certificationExpiryDate: req.body.certificationExpiryDate,
      scopeOfWork: req.body.scopeOfWork,
      clientName: req.body.clientName,
      standard: req.body.standard,
      email: req.body.email,
      companyPhoneCode: req.body.companyPhoneCode,
      companyPhoneNumber: req.body.companyPhoneNumber,
      country: req.body.country,
      city: req.body.city,
      firstSurveillanceAudit: req.body.firstSurveillanceAudit,
      secondSurveillanceAudit: req.body.secondSurveillanceAudit,
      certificationNumber: req.body.certificationNumber,
      firstSurveillanceStatus: req.body.firstSurveillanceStatus,
      secondSurveillanceStatus: req.body.secondSurveillanceStatus,
      firstSurveillanceNotes: req.body.firstSurveillanceNotes,
      secondSurveillanceNotes: req.body.secondSurveillanceNotes,
      status: req.body.status,
      assignedAgent: req.body.assignedAgent,
      alternateEmails: req.body.alternateEmails || existing.alternateEmails, // ✅ Update alternateEmails
      logo: req.files?.logo ? req.files.logo[0].path : existing.logo, // keep old logo if new not uploaded
      attachments: mergedAttachments, // preserve existing + new
      assigendVendor: req.body.assigendVendor|| existing.assigendVendor, // ✅ Vendor also linked here (if needed)
    };

    // Update Certification
    const certification = await Certification.findByIdAndUpdate(certificationId, updatedData, {
      new: true,
    });

    // ✅ Update Company document if it exists
    const existingCompany = await Company.findOne({ companyName: req.body.companyName });
    if (existingCompany) {
      existingCompany.address = req.body.address || existingCompany.address;
      existingCompany.logo = req.files?.logo ? req.files.logo[0].path : existingCompany.logo;
      existingCompany.clientName = req.body.clientName || existingCompany.clientName;
      existingCompany.country = req.body.country || existingCompany.country;
      existingCompany.city = req.body.city || existingCompany.city;
      existingCompany.companyEmail = req.body.email || existingCompany.companyEmail;
      existingCompany.companyPhoneCode = req.body.companyPhoneCode || existingCompany.companyPhoneCode;
      existingCompany.companyPhoneNumber = req.body.companyPhoneNumber || existingCompany.companyPhoneNumber;
      existingCompany.alternateEmails = req.body.alternateEmails || existingCompany.alternateEmails; // ✅ Update alternateEmails
      await existingCompany.save();
    }

    res.status(200).json({
      success: true,
      message: "Certification updated successfully!",
      certification,
    });
  } catch (error) {
    console.error("❌ Error updating certification:", error);
    res.status(500).json({ success: false, message: "Something went wrong", error });
  }
};




export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find the certification first
    const certification = await Certification.findById(id);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    // ✅ Get assigned agent ID (if any)
    const agentId = certification.assignedAgent;

    // ✅ Delete the certification
    await Certification.findByIdAndDelete(id);

    // ✅ Update agent data (decrease count & remove companyId)
    if (agentId) {
      const agent = await Agent.findById(agentId);
      if (agent) {
        agent.companyCount = Math.max(0, agent.companyCount - 1); // prevent negative count
        agent.companyIds = agent.companyIds.filter(
          (companyId) => companyId.toString() !== id
        );
        await agent.save();
      }
    }
    // ✅ Update vendor data (decrease count & remove companyId)
    const vendorId = certification.assigendVendor;
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        vendor.companyCount = Math.max(0, vendor.companyCount - 1); // prevent negative count
        vendor.companyIds = vendor.companyIds.filter(
          (companyId) => companyId.toString() !== id
        );
        await vendor.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully and agent updated!",
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting certification",
      error: error.message,
    });
  }
};

 



// ✅ Search Certification by certificationNumber and companyName
export const searchCertification = async (req, res) => {
  try {
    const { certificationNumber, companyName } = req.query;

    if (!certificationNumber || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Both certificationNumber and companyName are required.",
      });
    }

    // ✅ Step 1: Search in Certification model
    let certification = await Certification.findOne({
      certificationNumber,
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    // ✅ Step 2: If not found, search in IndividualCertification using clientName
    if (!certification) {
      certification = await IndividualCertification.findOne({
        certificationNumber,
        clientName: { $regex: new RegExp(`^${companyName}$`, "i") },
      });
    }

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "No certification found matching the provided details.",
      });
    }

    // ✅ Step 3: Send success response
    res.status(200).json({
      success: true,
      message: "Certification found successfully!",
      certification,
      source: certification.companyName ? "Company" : "Individual", // optional info
    });
  } catch (error) {
    console.error("Error searching certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching certification.",
      error: error.message,
    });
  }
};




// ✅ Get certification summary: companyName, certification count, and status
export const getCertificationSummary = async (req, res) => {
  try {
    // Group certifications by companyName
    const summary = await Certification.aggregate([
      {
        $group: {
          _id: "$companyName",
          certificationCount: { $sum: 1 },
          clientNames: { $addToSet: "$clientName" }, // collect unique client names
          status: { $first: "$status" }, // get first status
        },
      },
      {
        $project: {
          _id: 0,
          companyName: "$_id",
          certificationCount: 1,
          clientNames: 1,
          status: 1,
        },
      },
    ]);

    if (!summary.length) {
      return res.status(404).json({
        success: false,
        message: "No certifications found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Certification summary fetched successfully!",
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching certification summary:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certification summary.",
      error: error.message,
    });
  }
};



// ✅ Get all certifications of a company (with agent info & selected fields)
export const getCertificationsByCompany = async (req, res) => {
  try {
    const { companyName } = req.query;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required.",
      });
    }

    // Find all certifications matching company name (case-insensitive)
    const certifications = await Certification.find({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    })
      .select(
        "companyName certificationNumber standard dateOfRegistration certificationExpiryDate status attachments logo assignedAgent"
      )
      .sort({ createdAt: -1 });

    if (!certifications.length) {
      return res.status(404).json({
        success: false,
        message: `No certifications found for company: ${companyName}`,
      });
    }

    // Add agent info and include attachments & logo as-is
    const certificationsWithAgent = await Promise.all(
      certifications.map(async (cert) => {
        let agentInfo = null;
        if (cert.assignedAgent) {
          agentInfo = await Agent.findById(cert.assignedAgent)
            .select("agentName agentEmail agentNumber")
            .lean();
        }

        return {
          companyName: cert.companyName,
          certificationNumber: cert.certificationNumber,
          standard: cert.standard,
          dateOfRegistration: cert.dateOfRegistration,
          certificationExpiryDate: cert.certificationExpiryDate,
          status: cert.status,
          logo: cert.logo || null,          // always include logo
          attachments: cert.attachments || [], // send attachments exactly as stored
          assignedAgentInfo: agentInfo || {},  // send agent info or empty object
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Certifications fetched successfully!",
      total: certificationsWithAgent.length,
      companyName,
      certifications: certificationsWithAgent,
    });
  } catch (error) {
    console.error("Error fetching certifications by company:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching certifications by company",
      error: error.message,
    });
  }
};



export const filterCertifications = async (req, res) => {
  try {
    let {
      search = "",
      status = "All",
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // ✅ Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { companyName: regex },
        { scopeOfWork: regex },
        { clientName: regex },
        { standard: regex },
        { email: regex },
        { certificationNumber: regex },
      ];
    }

    // ✅ Status filter
    if (status && status !== "All") {
      query.status = status;
    }

    // ✅ Date range filter (based on dateOfRegistration)
    if (fromDate && toDate) {
      query.dateOfRegistration = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      query.dateOfRegistration = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.dateOfRegistration = { $lte: new Date(toDate) };
    }

    // ✅ Fetch filtered data with pagination
    const certifications = await Certification.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // ✅ Attach agent info to each certification
    const certificationsWithAgent = await Promise.all(
      certifications.map(async (cert) => {
        let agentInfo = null;
        if (cert.assignedAgent) {
          agentInfo = await Agent.findById(cert.assignedAgent).lean();
        }
        return {
          ...cert.toObject(),
          assignedAgentInfo: agentInfo,
        };
      })
    );

    // ✅ Count total
    const total = await Certification.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Filtered certifications fetched successfully",
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      certifications: certificationsWithAgent,
    });
  } catch (error) {
    console.error("Error filtering certifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while filtering certifications",
      error: error.message,
    });
  }
};









