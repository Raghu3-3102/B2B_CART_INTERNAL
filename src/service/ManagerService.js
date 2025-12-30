import Manager from "../models/ManagerModel/ManagerModel.js";
import { getManagerWithTotal } from "./managerAggregation.js";

/**
 * Create a new manager
 */
export const createManager = async (managerData) => {
  try {
    // Check if email already exists
    const existingManager = await Manager.findOne({ email: managerData.email });
    if (existingManager) {
      throw new Error("Manager with this email already exists");
    }

    const newManager = new Manager(managerData);
    await newManager.save();
    return { success: true, manager: newManager };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all managers (with optional pagination)
 */
export const getAllManagers = async (options = {}) => {
  try {
    const { page, limit, noPagination } = options;

    if (noPagination === "true" || noPagination === true) {
      const managers = await Manager.aggregate(getManagerWithTotal());
      return { success: true, managers };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const managers = await Manager.aggregate(getManagerWithTotal(skip, limit))

    const totalManagers = await Manager.countDocuments();

    return {
      success: true,
      managers,
      currentPage: pageNum,
      totalPages: Math.ceil(totalManagers / limitNum),
      totalManagers,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get manager by ID
 */
export const getManagerById = async (id) => {
  try {
    const manager = await Manager.findById(id);
    if (!manager) {
      throw new Error("Manager not found");
    }
    return { success: true, manager };
  } catch (error) {
    throw error;
  }
};

/**
 * Update manager by ID
 */
export const updateManager = async (id, updateData) => {
  try {
    // Check if manager exists
    const manager = await Manager.findById(id);
    if (!manager) {
      throw new Error("Manager not found");
    }

    // If email is being updated, check if new email already exists
    if (updateData.email && updateData.email !== manager.email) {
      const existingManager = await Manager.findOne({ email: updateData.email });
      if (existingManager) {
        throw new Error("Manager with this email already exists");
      }
    }

    const updatedManager = await Manager.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return { success: true, manager: updatedManager };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete manager by ID
 */
export const deleteManager = async (id) => {
  try {
    const manager = await Manager.findByIdAndDelete(id);
    if (!manager) {
      throw new Error("Manager not found");
    }
    return { success: true, message: "Manager deleted successfully" };
  } catch (error) {
    throw error;
  }
};


