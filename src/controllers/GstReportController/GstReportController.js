import Invoice from "../../models/InvoiceModel/InvoiceModel.js";

export const getGstReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};

    // ✅ Date range filter (optional)
    if (startDate && endDate) {
      matchStage.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await Invoice.aggregate([
      { $match: matchStage },

      // Only GST of INR invoices
      {
        $addFields: {
          gstAmountOnlyINR: {
            $cond: [
              { $eq: ["$currency", "INR"] },
              "$TotalGSTAmount",
              0
            ]
          }
        }
      },

      // Final group
      {
        $group: {
          _id: null,
          totalInvoiceCount: { $sum: 1 },
          totalGSTAmount: { $sum: "$gstAmountOnlyINR" }
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        totalInvoiceCount: 0,
        totalGSTAmount: 0
      });
    }

    return res.status(200).json(result[0]);

  } catch (error) {
    console.error("GST Report Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
