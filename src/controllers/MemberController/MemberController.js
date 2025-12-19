import * as memberService from "../../service/MemberService.js";

/**
 * Create a new member
 */
export const createMember = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Validate required fields
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required",
      });
    }

    const result = await memberService.createMember({ name, email, mobile });
    res.status(201).json({
      success: true,
      message: "Member created successfully",
      member: result.member,
    });
  } catch (error) {
    console.error("Error in createMember:", error);
    if (error.message === "Member with this email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Get all members
 */
export const getAllMembers = async (req, res) => {
  try {
    const { page, limit, noPagination } = req.query;
    const result = await memberService.getAllMembers({ page, limit, noPagination });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllMembers:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Get member by ID
 */
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await memberService.getMemberById(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMemberById:", error);
    if (error.message === "Member not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Update member by ID
 */
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name, email, mobile) must be provided for update",
      });
    }

    const result = await memberService.updateMember(id, updateData);
    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member: result.member,
    });
  } catch (error) {
    console.error("Error in updateMember:", error);
    if (error.message === "Member not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Member with this email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Delete member by ID
 */
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await memberService.deleteMember(id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in deleteMember:", error);
    if (error.message === "Member not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

