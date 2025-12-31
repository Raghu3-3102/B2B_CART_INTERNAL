import express from "express";
import {
  createManager,
  getAllManagers,
  getManagerById,
  updateManager,
  deleteManager,
  getMonthlyManagerPerformance,
  getManagerTargetPercentage,
  getMonthlyOverallPerformance,
  getManagerMonthwiseClosurev2,
  managerMonthlyPerformancePercentage
} from "../../controllers/ManagerController/ManagerController.js";

import { authMiddleware } from "../../middleware/authMiddleware.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";

const router = express.Router();

// Manager Routes
router.post("/", authMiddleware, permissionMiddleware(), createManager);
router.get("/", authMiddleware, getAllManagers);

// Performance Routes (must come before /:id route)
router.get("/performance/monthwise-closure", authMiddleware, getManagerMonthwiseClosurev2);
router.get("/performance/monthly/:id", authMiddleware, getMonthlyManagerPerformance);
router.get("/performance/target-percentage", authMiddleware, getManagerTargetPercentage);
router.get("/performance/monthly-overall", authMiddleware, getMonthlyOverallPerformance);
router.get("/performance/monthly-perform-percent", managerMonthlyPerformancePercentage)

// Manager CRUD Routes
router.get("/:id", authMiddleware, getManagerById);
router.put("/:id", authMiddleware, permissionMiddleware(), updateManager);
router.delete("/:id", authMiddleware, permissionMiddleware(), deleteManager);

export default router;


