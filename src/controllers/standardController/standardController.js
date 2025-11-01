import Standard from "../../models/StandardModel/StandardModel.js";

/**
 * ✅ Create Standard
 */
export const createStandard = async (req, res) => {
  try {
    const { standardName, description } = req.body;

    if (!standardName) {
      return res.status(400).json({ success: false, message: "Standard name is required" });
    }

    const newStandard = new Standard({ standardName, description });
    await newStandard.save();

    return res.status(201).json({
      success: true,
      message: "Standard created successfully",
      standard: newStandard
    });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Get All Standards
 */
export const getAllStandards = async (req, res) => {
  try {
    const standards = await Standard.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, standards });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Get Standard by ID
 */
export const getStandardById = async (req, res) => {
  try {
    const standard = await Standard.findById(req.params.id);
    if (!standard)
      return res.status(404).json({ success: false, message: "Standard not found" });

    return res.status(200).json({ success: true, standard });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Update Standard
 */
export const updateStandard = async (req, res) => {
  try {
    const updatedStandard = await Standard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedStandard)
      return res.status(404).json({ success: false, message: "Standard not found" });

    return res.status(200).json({
      success: true,
      message: "Standard updated successfully",
      updatedStandard
    });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Delete Standard
 */
export const deleteStandard = async (req, res) => {
  try {
    const deletedStandard = await Standard.findByIdAndDelete(req.params.id);
    if (!deletedStandard)
      return res.status(404).json({ success: false, message: "Standard not found" });

    return res.status(200).json({ success: true, message: "Standard deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};
