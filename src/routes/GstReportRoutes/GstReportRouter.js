import { getGstReport } from "../../controllers/GstReportController/GstReportController.js";
import express from "express";
const router = express.Router();

router.get("/gst-report", getGstReport);
export default router;