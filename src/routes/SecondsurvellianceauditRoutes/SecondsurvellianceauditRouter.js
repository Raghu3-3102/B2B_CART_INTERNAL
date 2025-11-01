import express from "express";
import {  SecondSurveillance ,filterSecondSurveillance} from "../../controllers/SecondsurvellianceauditController/SecondsurvellianceauditController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();


router.get("/",authMiddleware,SecondSurveillance)
router.get("/filter",authMiddleware,filterSecondSurveillance)

export default router;