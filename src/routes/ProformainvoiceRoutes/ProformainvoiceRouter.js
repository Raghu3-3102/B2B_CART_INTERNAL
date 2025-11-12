import express from "express";
import {
  createProformaInvoice,
  getAllProformaInvoices,
  getProformaInvoiceById,
  updateProformaInvoice,
  deleteProformaInvoice,
  editStatusProformaInvoice
} from "../../controllers/ProformainvoiceController/ProformainvoiceController.js";

import upload from "../../config/cloudinaryConfig.js";

const router = express.Router();

// ✅ Multiple attachments support: upload.fields()
router.post(
  "/",
  upload.fields([{ name: "attachments", maxCount: 10 }]),
  createProformaInvoice
);

router.get("/", getAllProformaInvoices);
router.get("/:id", getProformaInvoiceById);

router.put(
  "//:id",
  upload.fields([{ name: "attachments", maxCount: 10 }]),
  updateProformaInvoice
);

router.delete("/:id", deleteProformaInvoice);

router.patch("/status/:id", editStatusProformaInvoice);

export default router;
