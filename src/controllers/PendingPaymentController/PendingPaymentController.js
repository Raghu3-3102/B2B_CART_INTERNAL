import Invoice from "../../models/InvoiceModel/InvoiceModel.js";

/**
 * ✅ Get all invoices having pending payments
 */
export const getPendingPayments = async (req, res) => {
  try {
    const pendingInvoices = await Invoice.find({ "terms.status": "Pending" });

    res.status(200).json({
      success: true,
      pendingInvoices,
    });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
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
