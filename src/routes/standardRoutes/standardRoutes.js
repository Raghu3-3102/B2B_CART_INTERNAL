import express from "express";
import {
  createStandard,
  getAllStandards,
  getStandardById,
  updateStandard,
  deleteStandard,
} from "../../controllers/standardController/standardController.js";

const router = express.Router();

router.post("/", createStandard);
router.get("/", getAllStandards);
router.get("/:id", getStandardById);
router.put("/:id", updateStandard);
router.delete("/:id", deleteStandard);

export default router;
