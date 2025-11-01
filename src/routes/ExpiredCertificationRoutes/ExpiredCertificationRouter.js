import express from "express";
import { ExpiringCertifications,filterExpiringCertifications } from "../../controllers/ExpiredCertificationController/ExpiredCertificationController.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";

const router = express.Router();



router.get("/",authMiddleware,ExpiringCertifications)
router.get("/filter",authMiddleware,filterExpiringCertifications)

export default router;