import express from "express";
import {
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  filterCompanies
} from "../../controllers/ComponyController/ComponyController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";

const router = express.Router();

// Routes
router.get("/", authMiddleware ,getAllCompanies);       
router.get("/filter",authMiddleware ,filterCompanies)   // Get all companies
router.get("/:id",authMiddleware , getCompanyById);       // Get company by ID
router.put("/:id",authMiddleware , updateCompany);        // Update company
router.delete("/:id",authMiddleware ,permissionMiddleware(), deleteCompany);     // Delete company


export default router;
