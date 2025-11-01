import express from "express";
import upload from "../../config/cloudinaryConfig.js";
import {
  createIndividualCertification,
  getAllIndividualCertifications,
  getIndividualCertificationById,
  updateIndividualCertification,
  deleteIndividualCertification,
} from "../../controllers/individualCertificationController/individualCertificationController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();

// 🟢 Create certification
router.post(
  "/create",
  authMiddleware,
  upload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "logo", maxCount: 1 },
  ]),
  createIndividualCertification
);

// 🔵 Get all certifications
router.get("/", authMiddleware, getAllIndividualCertifications);

// 🟣 Get certification by ID
router.get("/:id", authMiddleware, getIndividualCertificationById);

// 🟠 Update certification
router.put(
  "/update/:id",
  authMiddleware,
  upload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "logo", maxCount: 1 },
  ]),
  updateIndividualCertification
);

// 🔴 Delete certification
router.delete("/delete/:id", authMiddleware, deleteIndividualCertification);

export default router;
