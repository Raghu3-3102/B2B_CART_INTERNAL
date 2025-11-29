import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Company from "../../models/componyModel/ComponyModel.js";
import proformaInvoice from "../../models/ProformainvoiceModel/ProformainvoiceModel.js";

import Agent from "../../models/AgentModel/AgentModel.js";


export const getDashboardData = async (req, res) => {
  try {
    // ******** TOTAL PROFORMA / COMPANIES ******** //
    const totalProforma = await proformaInvoice.countDocuments();
    const totalCompanies = await Company.countDocuments();

    // ******** TOTAL UNIQUE INVOICE COUNT (companyId + standard) ******** //
    const invoices = await Invoice.find().select("companyId standard").lean();

    const uniqueSet = new Set();

    invoices.forEach(inv => {
      if (!inv.companyId || !inv.standard) return;

      inv.standard.forEach(std => {
        const key = `${inv.companyId}_${std}`;
        uniqueSet.add(key);
      });
    });

    const totalInvoices = uniqueSet.size; // 🔥 FIXED COUNT

    // ******** TOTAL GST / TDS / PENDING ******** //
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalGST: {
            $sum: {
              $add: [
                { $ifNull: ["$TotalGSTAmount", 0] },
                { $sum: "$terms.gstAmount" }
              ]
            }
          },
          totalTDS: {
            $sum: {
              $add: [
                { $ifNull: ["$TotalTDSAmount", 0] },
                { $sum: "$terms.TDSAmmount" }
              ]
            }
          },
          totalPendingPayment: { $sum: "$PendingPaymentInINR" }
        }
      }
    ]);

    const s = stats[0] || {
      totalGST: 0,
      totalTDS: 0,
      totalPendingPayment: 0,
    };

    // ******** RECENT 3 DATA ******** //
    const recentProforma = await proformaInvoice.find().sort({ proformaInvoiceDate: -1 }).limit(3);
    const recentCompanies = await Company.find().sort({ createdAt: -1 }).limit(3);
    const recentInvoices = await Invoice.find().sort({ InvoiceDate: -1 }).limit(3);

    const recentPendingInvoices = await Invoice.find({ PendingPaymentInINR: { $gt: 0 } })
      .sort({ InvoiceDate: -1 })
      .limit(3);

    const rexentinvoicewithINR = await Invoice.find({ currency: "INR", PendingPaymentInINR: { $gt: 0 } })
      .sort({ InvoiceDate: -1 })
      .limit(3);

    // ******** SEND RESPONSE ******** //
    return res.status(200).json({
      totals: {
        totalProforma,
        totalCompanies,
        totalInvoices,  // 🔥 Now Correct + Unique (companyId + standard)
        totalGST: s.totalGST,
        totalTDS: s.totalTDS,
        totalPendingPayment: s.totalPendingPayment,
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

    // Create start & end date for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const agents = await Agent.find();

    const finalData = [];

    for (const agent of agents) {
      // Find all invoices for this agent in the month
      const invoices = await Invoice.find({
        agentId: agent._id,
        InvoiceDate: { $gte: startDate, $lt: endDate },
      }).lean();

      // Group by companyId + standard (array of strings)
      const groups = {};

      invoices.forEach(inv => {
        if (!inv.companyId || !inv.standard || inv.standard.length === 0) return;

        inv.standard.forEach(std => {
          const key = `${inv.companyId}-${std}`;
          // Only count one baseClosureAmount per (company + standard)
          if (!groups[key]) {
            groups[key] = inv.baseClosureAmount;
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

    // Sort descending by totalClosureAmount
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

    const startYear = new Date(year, 0, 1);   // Jan 1
    const endYear = new Date(year, 11, 31, 23, 59, 59); // Dec 31

    // Fetch invoices of this agent for the selected year
    const invoices = await Invoice.find({
      agentId,
      InvoiceDate: { $gte: startYear, $lte: endYear }
    }).lean();

    // Prepare empty months (Jan–Dec)
    const monthWise = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    // Temporary grouping
    const monthGroup = {};

    invoices.forEach(inv => {
      if (!inv.companyId || !inv.standard || inv.standard.length === 0) return;

      const monthIndex = new Date(inv.createdAt).getMonth(); // 0–11
      const monthName = Object.keys(monthWise)[monthIndex];

      if (!monthGroup[monthName]) monthGroup[monthName] = {};

      inv.standard.forEach(std => {
        const key = `${inv.companyId}-${std}`;

        // Only count one invoice per (company + standard)
        if (!monthGroup[monthName][key]) {
          monthGroup[monthName][key] = inv.baseClosureAmount;
        }
      });
    });

    // Summing month totals
    for (const month in monthGroup) {
      const total = Object.values(monthGroup[month]).reduce((a, b) => a + b, 0);
      monthWise[month] = total;
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


