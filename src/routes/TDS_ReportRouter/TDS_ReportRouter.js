import { getTDSReport } from "../../controllers/TDS_ReportController/TDS_ReportController.js";
import express from "express";
const router = express.Router();

router.get("/tds-report", getTDSReport);
export default router;