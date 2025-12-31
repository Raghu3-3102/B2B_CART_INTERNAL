import * as managerService from "../../service/ManagerService.js";
import Invoice from "../../models/InvoiceModel/InvoiceModel.js"
import mongoose from "mongoose";

/**
 * Create a new manager
 */
export const createManager = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Validate required fields
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required",
      });
    }

    const result = await managerService.createManager({ name, email, mobile });
    res.status(201).json({
      success: true,
      message: "Manager created successfully",
      manager: result.manager,
    });
  } catch (error) {
    console.error("Error in createManager:", error);
    if (error.message === "Manager with this email already exists") {
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
 * Get all managers
 */
export const getAllManagers = async (req, res) => {
  try {
    const { page, limit, noPagination } = req.query;
    const result = await managerService.getAllManagers({ page, limit, noPagination });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllManagers:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Get manager by ID
 */
export const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await managerService.getManagerById(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getManagerById:", error);
    if (error.message === "Manager not found") {
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
 * Update manager by ID
 */
export const updateManager = async (req, res) => {
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

    const result = await managerService.updateManager(id, updateData);
    res.status(200).json({
      success: true,
      message: "Manager updated successfully",
      manager: result.manager,
    });
  } catch (error) {
    console.error("Error in updateManager:", error);
    if (error.message === "Manager not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Manager with this email already exists") {
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
 * Delete manager by ID
 */
export const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await managerService.deleteManager(id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in deleteManager:", error);
    if (error.message === "Manager not found") {
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
 * Get Monthly Manager Performance
 */
export const getMonthlyManagerPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required",
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid year or month. Month must be between 1 and 12",
      });
    }

    const result = await managerService.getMonthlyManagerPerformance(
      id,
      yearNum,
      monthNum
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMonthlyManagerPerformance:", error);
    if (error.message === "Manager not found") {
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
 * Get Monthly Overall Performance
 */
export const getMonthlyOverallPerformance = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required",
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid year or month. Month must be between 1 and 12",
      });
    }

    const result = await Invoice.aggregate([
      // 1️⃣ Filter by year
      {
        $match: {
          InvoiceDate: {
            $gte: new Date("2025-01-01"),
            $lte: new Date("2025-12-31T23:59:59")
          }
        }
      },
    
      // 2️⃣ Join agent to get managerId & target
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agent"
        }
      },
      { $unwind: "$agent" },
    
      // 3️⃣ Normalize closure amount to INR
      {
        $addFields: {
          closureINR: {
            $cond: [
              { $eq: ["$currency", "INR"] },
              "$baseClosureAmount",
              "$baseClosureAmountINR"
            ]
          },
          month: { $month: "$InvoiceDate" }
        }
      },
    
      // 4️⃣ Group by manager + month
      {
        $group: {
          _id: {
            managerId: "$agent.managerId",
            month: "$month"
          },
          achieved: { $sum: "$closureINR" },
          monthlyTarget: { $sum: "$agent.target" }
        }
      },
    
      // 5️⃣ Calculate percentage
      {
        $addFields: {
          targetPercentage: {
            $cond: [
              { $gt: ["$monthlyTarget", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$achieved", "$monthlyTarget"] }, 100] },
                  2
                ]
              },
              0
            ]
          }
        }
      },
    
      // 6️⃣ Shape final output
      {
        $project: {
          _id: 0,
          managerId: "$_id.managerId",
          month: "$_id.month",
          achieved: 1,
          monthlyTarget: 1,
          targetPercentage: 1
        }
      },
    
      // 7️⃣ Sort nicely for graphs
      {
        $sort: { managerId: 1, month: 1 }
      }
    ]);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMonthlyOverallPerformance:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const getManagerMonthwiseClosurev2 = async (req, res) => {
  try {
    const { managerId, year } = req.query;

    if (!managerId || !year) {
      return res.status(400).json({
        success: false,
        message: "managerId and year required"
      });
    }

    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31, 23, 59, 59);

    const data = await Invoice.aggregate([
      // 1️⃣ Filter invoices by year
      {
        $match: {
          InvoiceDate: { $gte: startYear, $lte: endYear },
          companyId: { $ne: null },
          standard: { $exists: true, $ne: [] }
        }
      },

      // 2️⃣ Join Agent collection
      {
        $lookup: {
          from: "agents",              // ⚠️ collection name (plural!)
          localField: "agentId",
          foreignField: "_id",
          as: "agent"
        }
      },

      // 3️⃣ Flatten agent array
      { $unwind: "$agent" },

      // 4️⃣ Filter by manager
      {
        $match: {
          "agent.managerId": new mongoose.Types.ObjectId(managerId)
        }
      },

      // 5️⃣ Compute month + normalized closure
      {
        $addFields: {
          month: { $month: "$InvoiceDate" },
          closure: {
            $cond: [
              { $eq: ["$currency", "INR"] },
              { $ifNull: ["$baseClosureAmount", 0] },
              { $ifNull: ["$baseClosureAmountINR", 0] }
            ]
          }
        }
      },

      // 6️⃣ Expand standards
      { $unwind: "$standard" },

      // 7️⃣ Deduplicate (month + agent + company + standard)
      {
        $group: {
          _id: {
            month: "$month",
            agentId: "$agentId",
            companyId: "$companyId",
            standard: "$standard"
          },
          closure: { $first: "$closure" }
        }
      },

      // 8️⃣ Month-wise sum (ALL agents under manager)
      {
        $group: {
          _id: "$_id.month",
          total: { $sum: "$closure" }
        }
      }
    ]);

    // 9️⃣ Format Jan–Dec output
    const monthWise = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    data.forEach(({ _id, total }) => {
      monthWise[months[_id - 1]] = total;
    });

    return res.json({
      success: true,
      managerId,
      year,
      monthWise
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Manager Target Percentage
 */
export const getManagerTargetPercentage = async (req, res) => {
  try {
    const { managerId, year } = req.query;

    if (!managerId || !year) {
      return res.status(400).json({
        success: false,
        message: "managerId and year required"
      });
    }

    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31, 23, 59, 59);

    const managerObjectId = new mongoose.Types.ObjectId(managerId);

    const data = await Invoice.aggregate([
      // 1️⃣ Filter invoices by year
      {
        $match: {
          InvoiceDate: { $gte: startYear, $lte: endYear },
          companyId: { $ne: null },
          standard: { $exists: true, $ne: [] }
        }
      },

      // 2️⃣ Join agents
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agent"
        }
      },
      { $unwind: "$agent" },

      // 3️⃣ Filter agents under manager
      {
        $match: {
          "agent.manager": managerObjectId
        }
      },

      // 4️⃣ Compute month & closure
      {
        $addFields: {
          month: { $month: "$InvoiceDate" },
          closure: {
            $cond: [
              { $eq: ["$currency", "INR"] },
              { $ifNull: ["$baseClosureAmount", 0] },
              { $ifNull: ["$baseClosureAmountINR", 0] }
            ]
          },
          agentMonthlyTarget: "$agent.target"
        }
      },

      // 5️⃣ Expand standards
      { $unwind: "$standard" },

      // 6️⃣ Deduplicate (agent + company + standard + month)
      {
        $group: {
          _id: {
            month: "$month",
            agentId: "$agentId",
            companyId: "$companyId",
            standard: "$standard"
          },
          closure: { $first: "$closure" },
          agentMonthlyTarget: { $first: "$agentMonthlyTarget" }
        }
      },

      // 7️⃣ Month-wise achieved & target
      {
        $group: {
          _id: "$_id.month",
          achieved: { $sum: "$closure" },
          target: { $sum: "$agentMonthlyTarget" }
        }
      },

      // 8️⃣ Calculate percentage
      {
        $addFields: {
          percentage: {
            $cond: [
              { $eq: ["$target", 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ["$achieved", "$target"] }, 100] },
                  2
                ]
              }
            ]
          }
        }
      }
    ]);

    // 9️⃣ Format for graph
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const graphData = months.map((m, i) => {
      const row = data.find(d => d._id === i + 1);
      return {
        month: m,
        achieved: row?.achieved || 0,
        target: row?.target || 0,
        percentage: row?.percentage || 0
      };
    });

    return res.json({
      success: true,
      managerId,
      year,
      graphData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * To get List of manager's performance percentage by month and year 
 * @param {month, year}} req 
 */
export const managerPercentageChart = async (req, res) => {
  try{
    const { managerId, year } = req.query;

    if (!managerId || !year) {
      return res.status(400).json({
        success: false,
        message: "managerId and year required"
      });
    }

    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31, 23, 59, 59);

    const managerObjectId = new mongoose.Types.ObjectId(managerId);


  } catch{
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export const managerMonthlyPerformancePercentage = async (req, res) => {
  try{
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year required"
      });
    }

    // month expected as 1–12
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const data = await managerService.managerMonthlyPerformance(startDate, endDate)

    return res.json({
      success: true,
      data,
      message: "Manager monthly performance retrieved successfully."
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}