import { getDashboardData,getAgentwiseDataForChart,getAgentMonthwiseClosure,getAgentTargetGraph } from "../../controllers/DashboardController/DashboardController.js";

import express from "express";
const router = express.Router();
router.get("/data", getDashboardData);
router.get("/agentwise-chart", getAgentwiseDataForChart);
router.get("/agent-monthwise-closure", getAgentMonthwiseClosure);
router.get("/agent-target-graph", getAgentTargetGraph);

export default router;