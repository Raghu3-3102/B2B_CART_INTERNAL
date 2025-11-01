import express from "express";
import {  getDashboardOverview,getYearlyCertificationStats,
    getCertificationStatsByPeriod ,getMonthlyCertificationStats,
    getTodayCertificationStats,getCompanyRegistrationsByMonth,
    getCurrentWeekCertificationStats } from "../../controllers/OverViewController/OverviewController.js";

import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
import { authMiddleware } from "../../middleware/AuthMiddilewereAll.js";
const router = express.Router();

router.get("/dashboard",authMiddleware, getDashboardOverview);
router.get("/dashboard/certifications/year/:year",authMiddleware, getYearlyCertificationStats);
router.get("/certifications/stats",authMiddleware, getCertificationStatsByPeriod);
router.get("/certifications/stats/monthly",authMiddleware,getMonthlyCertificationStats)
router.get("/certifications/stats/today",authMiddleware,getTodayCertificationStats )
router.get("/compoy/regitration",authMiddleware,getCompanyRegistrationsByMonth)
router.get("/certifications/stats/weekly",authMiddleware,getCurrentWeekCertificationStats)

export default router;
