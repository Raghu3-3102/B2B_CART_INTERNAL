import Member from "../models/MemberModel/MemberModel.js";

/**
 * Create a new member
 */
export const createMember = async (memberData) => {
  try {
    // Check if email already exists
    const existingMember = await Member.findOne({ email: memberData.email });
    if (existingMember) {
      throw new Error("Member with this email already exists");
    }

    const newMember = new Member(memberData);
    await newMember.save();
    return { success: true, member: newMember };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all members (with optional pagination)
 */
export const getAllMembers = async (options = {}) => {
  try {
    const { page, limit, noPagination } = options;

    if (noPagination === 'true' || noPagination === true) {
      const members = await Member.find().sort({ createdAt: -1 });
      return { success: true, members };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const members = await Member.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const totalMembers = await Member.countDocuments();

    return {
      success: true,
      members,
      currentPage: pageNum,
      totalPages: Math.ceil(totalMembers / limitNum),
      totalMembers,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get member by ID
 */
export const getMemberById = async (id) => {
  try {
    const member = await Member.findById(id);
    if (!member) {
      throw new Error("Member not found");
    }
    return { success: true, member };
  } catch (error) {
    throw error;
  }
};

/**
 * Update member by ID
 */
export const updateMember = async (id, updateData) => {
  try {
    // Check if member exists
    const member = await Member.findById(id);
    if (!member) {
      throw new Error("Member not found");
    }

    // If email is being updated, check if new email already exists
    if (updateData.email && updateData.email !== member.email) {
      const existingMember = await Member.findOne({ email: updateData.email });
      if (existingMember) {
        throw new Error("Member with this email already exists");
      }
    }

    const updatedMember = await Member.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return { success: true, member: updatedMember };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete member by ID
 */
export const deleteMember = async (id) => {
  try {
    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      throw new Error("Member not found");
    }
    return { success: true, message: "Member deleted successfully" };
  } catch (error) {
    throw error;
  }
};

