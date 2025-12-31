import { getDashboardData,getAgentwiseDataForChart,getAgentMonthwiseClosure,getAgentTargetGraph, getAgentMonthwiseClosurev2 } from "../../controllers/DashboardController/DashboardController.js";

import express from "express";
const router = express.Router();
router.get("/data", getDashboardData);
router.get("/agentwise-chart", getAgentwiseDataForChart);
router.get("/agent-monthwise-closure", getAgentMonthwiseClosure);
router.get("/v2/agent-monthwise-closure", getAgentMonthwiseClosurev2);
router.get("/agent-target-graph", getAgentTargetGraph);

export default router;