import express from "express";
import {  firstSurveillance,filterFirstSurveillance } from "../../controllers/FirstSurvellianceauditController/FirstSurvellianceauditController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();


router.get("/",authMiddleware,firstSurveillance)
router.get("/filter",authMiddleware,filterFirstSurveillance)

export default router;