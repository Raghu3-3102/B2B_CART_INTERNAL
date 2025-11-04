import express from "express";
import {
  createCompanyDetails,
  getAllCompanyDetails,
  getCompanyDetailsById,
  updateCompanyDetails,
  deleteCompanyDetails,
} from "../../controllers/companyDetailsController/companyDetailsController.js";

const router = express.Router();

router.post("/create", createCompanyDetails);          // ✅ CREATE
router.get("/all", getAllCompanyDetails);              // ✅ READ ALL
router.get("/:id", getCompanyDetailsById);             // ✅ READ ONE
router.put("/update/:id", updateCompanyDetails);       // ✅ UPDATE
router.delete("/delete/:id", deleteCompanyDetails);    // ✅ DELETE

export default router;
