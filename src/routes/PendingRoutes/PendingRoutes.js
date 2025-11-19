import express from "express";
import {
  getPendingPayments,
  groupInvoicesByStandard,
  getPendingPaymentsByInvoiceId,
  updatePendingPaymentStatus,
} from "../../controllers/PendingPaymentController/PendingPaymentController.js";

const router = express.Router();

// ✅ Get all pending payments (all invoices having pending terms)
router.get("/pending", getPendingPayments);

router.get("/group-by-standard", groupInvoicesByStandard);

// ✅ Get pending payments BY invoiceId
router.get("/pending/:id", getPendingPaymentsByInvoiceId);

// ✅ Update payment status of a specific term in an invoice
router.put("/update-status", updatePendingPaymentStatus);

export default router;
