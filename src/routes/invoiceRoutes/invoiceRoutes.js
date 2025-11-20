import express from "express";
import {
  createInvoice,
  getInvoiveByStanderdandcomponyName,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoicesFilter
} from "../../controllers/InvoiceController/InvoiceController.js";

import upload from "../../config/cloudinaryConfig.js";

const router = express.Router();

// ✅ Multiple attachments support: upload.array("attachments", 10)
router.post("/", upload.fields([
    { name: "attachments", maxCount: 10 }
  ]), createInvoice);
router.get("/standard/:standard/companyId/:companyId", getInvoiveByStanderdandcomponyName);
router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", upload.fields([{ name: "attachments", maxCount: 10 }]), updateInvoice);
router.delete("/:id", deleteInvoice);
router.get("/filter/search",  getInvoicesFilter);

export default router;
