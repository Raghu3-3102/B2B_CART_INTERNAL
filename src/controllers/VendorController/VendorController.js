import Vendor from "../../models/VendorModel/VendorModel.js";

// Create Vendor
export const createVendor = async (req, res) => {
  try {
   
    console.log(req.body);
    const vendor = new Vendor(req.body);
    await vendor.save();

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      vendor,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Vendors
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("companyIds")
      .populate("individualsId");

    return res.json({ success: true, vendors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Vendor By ID
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("companyIds")
      .populate("individualsId");

    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, vendor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Vendor
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, message: "Vendor updated", vendor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Vendor
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
