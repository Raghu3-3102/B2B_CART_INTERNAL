import CompanyDetails from "../../models/companyDetailsModel/companyDetailsModel.js";

/**
 * ✅ Create Company Details
 */
export const createCompanyDetails = async (req, res) => {
  try {
    const company = await CompanyDetails.create(req.body);
    res.status(201).json({
      success: true,
      message: "Company details created successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Get All Company Details
 */
export const getAllCompanyDetails = async (req, res) => {
  try {
    const companies = await CompanyDetails.find();
    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Get Single Company Detail by ID
 */
export const getCompanyDetailsById = async (req, res) => {
  try {
    const company = await CompanyDetails.findById(req.params.id);

    if (!company) return res.status(404).json({ success: false, message: "Company details not found" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Update Company Details
 */
export const updateCompanyDetails = async (req, res) => {
  try {
    const company = await CompanyDetails.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) return res.status(404).json({ success: false, message: "Company details not found" });

    res.status(200).json({
      success: true,
      message: "Company details updated successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Delete Company Details
 */
export const deleteCompanyDetails = async (req, res) => {
  try {
    const company = await CompanyDetails.findByIdAndDelete(req.params.id);

    if (!company) return res.status(404).json({ success: false, message: "Company details not found" });

    res.status(200).json({
      success: true,
      message: "Company details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
