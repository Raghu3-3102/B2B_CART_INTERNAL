import { populate } from "dotenv";
import Invoice from "../../models/InvoiceModel/InvoiceModel.js";

/**
 * ✅ Get all invoices having pending payments
 */
export const getPendingPayments = async (req, res) => {
  try {
    const result = await Invoice.aggregate([
      // STEP 1: Find all invoices which are NOT completed
      {
        $match: {
          IsCompleted: { $in: [false, "false", 0] }
        }
      },

      // STEP 2: Group keys we need (company + standard)
      {
        $group: {
          _id: {
            companyId: "$companyId",
            standard: "$standard"
          }
        }
      },

      // STEP 3: Get all invoices for these groups
      {
        $lookup: {
          from: "invoices",
          let: { compId: "$_id.companyId", stdId: "$_id.standard" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$compId"] },
                    { $eq: ["$standard", "$$stdId"] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } }
          ],
          as: "allInvoices"
        }
      },

      // STEP 4: Populate agent
      {
        $lookup: {
          from: "agents",
          localField: "allInvoices.agentId",
          foreignField: "_id",
          as: "agentDetails"
        }
      },

      // STEP 5: Populate company details
      {
        $lookup: {
          from: "companydetails",
          localField: "allInvoices.componyDetails",
          foreignField: "_id",
          as: "companyDetails"
        }
      },

      // STEP 6: Populate standard details
       {
  $lookup: {
    from: "standards",
    let: { stdId: { $arrayElemAt: ["$_id.standard", 0] } },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$_id",
              { $toObjectId: "$$stdId" }
            ]
          }
        }
      }
    ],
    as: "standardDetails"
  }
}

 ,

      // STEP 7: Clean response
      {
        $project: {
          _id: 0,
          companyId: "$_id.companyId",
          standard: "$standardDetails",
          allInvoices: "$allInvoices",
          agent: "$agentDetails",
          companyDetails: "$companyDetails"
        }
      }
    ]);

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};






/**
 * ✅ Group invoices by Standard
 * One invoice contains one standard
 */
export const groupInvoicesByStandard = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No invoices found",
      });
    }

    // GROUPING LOGIC
    const grouped = {};

    invoices.forEach((inv) => {
      const standard = inv.standard?.[0]; // since invoice has only one standard

      if (!grouped[standard]) {
        grouped[standard] = {
          standard: standard,
          totalInvoices: 0,
          invoices: [],
        };
      }

      grouped[standard].totalInvoices++;
      grouped[standard].invoices.push(inv);
    });

    res.status(200).json({
      success: true,
      groupedStandards: Object.values(grouped),
    });
  } catch (error) {
    console.error("Error grouping invoices by standard:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


/**
 * ✅ Get pending terms for one specific invoice
 */
export const getPendingPaymentsByInvoiceId = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const pendingTerms = invoice.terms.filter(
      (term) => term.status === "Pending"
    );

    res.status(200).json({
      success: true,
      pendingTerms,
    });
  } catch (error) {
    console.error("Error fetching pending payments by invoice ID:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * ✅ Update a specific term inside an invoice
 */
export const updatePendingPaymentStatus = async (req, res) => {
  try {
    const { invoiceId, termId, status } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const term = invoice.terms.id(termId);
    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    term.status = status;
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
