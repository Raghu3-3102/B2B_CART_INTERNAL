import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Company from "../../models/componyModel/ComponyModel.js";
import proformaInvoice from "../../models/ProformainvoiceModel/ProformainvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";



import { buildTaxAggregationStages } from "../../utils/TaxAggregationStages.js";

export const getDashboardData = async (req, res) => {
  try {
    // ******** TOTAL COUNTS ******** //
    const totalProforma = await proformaInvoice.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalInvoices = await Invoice.countDocuments();

    // ******** GST TOTAL ******** //
    const gstStats = await Invoice.aggregate([
      ...buildTaxAggregationStages("GST")
    ]);

    const totalGST = gstStats[0]?.totalAmount || 0;

    // ******** TDS TOTAL ******** //
    const tdsStats = await Invoice.aggregate([
      ...buildTaxAggregationStages("TDS")
    ]);

    const totalTDS = tdsStats[0]?.totalAmount || 0;

    // ******** PENDING PAYMENT ******** //
//     const pendingStats = await Invoice.aggregate([
//   {
//     $sort: {
//       companyId: 1,
//       standardId: 1,
//       InvoiceDate: -1  // latest first
//     }
//   },
//   {
//     $group: {
//       _id: {
//         companyId: "$companyId",
//         standardId: "$standardId"
//       },
//       latestPending: { $first: "$PendingPaymentInINR" },  // pick only the latest invoice
//       latestCurrency: { $first: "$currency" },  // capture currency of the latest invoice
//       latestBaseClosureINR: { $first: "$baseClosureAmountINR" }  // capture baseClosureAmountINR if applicable
//     }
//   },
//   {
//     $project: {
//       // Calculate the pending payment based on currency
//       totalPendingPayment: {
//         $cond: {
//           if: { $eq: ["$latestCurrency", "INR"] },  // If INR, use PendingPaymentInINR
//           then: { $toDouble: "$latestPending" },
//           else: { $toDouble: "$latestBaseClosureINR" }  // Otherwise use baseClosureAmountINR
//         }
//       }
//     }
//   },
//   {
//     $group: {
//       _id: null,
//       totalPendingPayment: { $sum: "$totalPendingPayment" }
//     }
//   }
// ]);

    const pendingStats = await Invoice.aggregate([
      {
        $match:
          {
            IsCompleted: {
              $ne: true
            }
          }
      },
      {
        $group:
        // group by currenct and sum the pendingPayment
          {
            _id: "$currency",
            totalPendingAmtINR: {
              $sum: "$PendingPaymentInINR"
            }
          }
      }])


    // const totalPendingPayment =
    //   pendingStats[0]?.totalPendingPayment || 0;

    // ******** RECENT DATA ******** //
    const recentProforma = await proformaInvoice
      .find()
      .sort({ proformaInvoiceDate: -1 })
      .limit(3);

    const recentCompanies = await Company
      .find()
      .sort({ createdAt: -1 })
      .limit(3);

    const recentInvoices = await Invoice
      .find()
      .sort({ InvoiceDate: -1 })
      .limit(3);

    const recentPendingInvoices = await Invoice.find({
      PendingPaymentInINR: { $gt: 0 }
    })
      .sort({ InvoiceDate: -1 })
      .limit(3);

    const rexentinvoicewithINR = await Invoice.find({
      currency: "INR",
      PendingPaymentInINR: { $gt: 0 }
    })
      .sort({ InvoiceDate: -1 })
      .limit(3);

    // ******** SEND RESPONSE ******** //
    return res.status(200).json({
      totals: {
        totalProforma,
        totalCompanies,
        totalInvoices,

        // GST / TDS from central logic
        totalGST,
        totalTDS,

        totalPendingPayment : pendingStats
      },
      recent: {
        proforma: recentProforma,
        companies: recentCompanies,
        invoices: recentInvoices,
        PendingInvoices: recentPendingInvoices,
        invoicewithINR: rexentinvoicewithINR
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};





export const getAgentwiseDataForChart = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const agents = await Agent.find();
    const finalData = [];

    for (const agent of agents) {
      const invoices = await Invoice.find({
        agentId: agent._id,
        InvoiceDate: { $gte: startDate, $lt: endDate },
      }).lean();

      const groups = {};

      invoices.forEach(inv => {
        if (!inv.companyId || !inv.standard || inv.standard.length === 0) return;

        inv.standard.forEach(std => {
          const key = `${inv.companyId}-${std}`;

          if (!groups[key]) {
            const closure =
              inv.currency === "INR"
                ? inv.baseClosureAmount
                : inv.baseClosureAmountINR;

            groups[key] = closure;
          }
        });
      });

      const totalClosureAmount = Object.values(groups).reduce((a, b) => a + b, 0);

      finalData.push({
        agentName: agent.agentName,
        agentId: agent._id,
        totalClosureAmount,
      });
    }

    finalData.sort((a, b) => b.totalClosureAmount - a.totalClosureAmount);

    return res.status(200).json({
      success: true,
      chartData: finalData,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


export const getAgentMonthwiseClosure = async (req, res) => {
  try {
    const { agentId, year } = req.query;

    if (!agentId || !year) {
      return res.status(400).json({ success: false, message: "agentId and year required" });
    }

    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await Invoice.find({
      agentId,
      InvoiceDate: { $gte: startYear, $lte: endYear }
    }).lean();

    const monthWise = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    const monthGroup = {};

    invoices.forEach(inv => {
      if (!inv.companyId || !inv.standard || inv.standard.length === 0) return;

      const monthIndex = new Date(inv.createdAt).getMonth();
      const monthName = Object.keys(monthWise)[monthIndex];

      if (!monthGroup[monthName]) monthGroup[monthName] = {};

      inv.standard.forEach(std => {
        const key = `${inv.companyId}-${std}`;

        if (!monthGroup[monthName][key]) {
          const closure =
            inv.currency === "INR"
              ? inv.baseClosureAmount
              : inv.baseClosureAmountINR;

          monthGroup[monthName][key] = closure;
        }
      });
    });

    for (const month in monthGroup) {
      monthWise[month] = Object.values(monthGroup[month]).reduce((a, b) => a + b, 0);
    }

    return res.status(200).json({
      success: true,
      agentId,
      year,
      monthWise
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


export const getAgentTargetGraph = async (req, res) => {
  try {
    // Fetch all agents with required fields
    const agents = await Agent.find({}, "agentName target targetAchieved");

    // Format for graph (x: name, y: achieved)
    const graphData = agents.map(agent => ({
      agentName: agent.agentName,
      agentTarget: agent.target,
      achievedAmount: agent.targetAchieved,
      achievedPercentage: agent.target > 0 ? (agent.targetAchieved / agent.target) * 100 : 0,
    }));

    res.status(200).json({
      success: true,
      graphData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while fetching graph data",
      error
    });
  }
};



