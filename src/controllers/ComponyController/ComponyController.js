import Company from "../../models/componyModel/ComponyModel.js";
import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js"

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("invoiceIds")   // field in Company schema
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCompaniesNameAndId = async (req, res) => {
  try {
    const companies = await Company.find().select("_id companyName")
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id)
      .populate("invoiceIds")   // field in Company schema
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const company = await Company.findByIdAndUpdate(id, updatedData, { new: true });
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndDelete(id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// export const filterCompanies = async (req, res) => {
//   try {
//     let {
//       search = "",
//       status = "All",
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 10;
//     const skip = (page - 1) * limit;

//     const query = {};

//     // ✅ Search by companyName or clientName
//     if (search) {
//       const regex = new RegExp(search, "i");
//       query.$or = [{ companyName: regex }, { clientName: regex }];
//     }

//     // ✅ Filter by status (default = All)
//     if (status && status !== "All") {
//       query.status = status;
//     }

//     // ✅ Filter by creation date (createdAt)
//     if (fromDate && toDate) {
//       query.createdAt = {
//         $gte: new Date(fromDate),
//         $lte: new Date(toDate),
//       };
//     } else if (fromDate) {
//       query.createdAt = { $gte: new Date(fromDate) };
//     } else if (toDate) {
//       query.createdAt = { $lte: new Date(toDate) };
//     }

//     // ✅ Fetch filtered companies with pagination
//     const companies = await Company.find(query)
//       .populate("certificationIds") // optional: to include certifications
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // ✅ Count total for pagination
//     const total = await Company.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       message: "Filtered companies fetched successfully",
//       totalItems: total,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       companies,
//     });
//   } catch (error) {
//     console.error("Error filtering companies:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while filtering companies",
//       error: error.message,
//     });
//   }
// };

