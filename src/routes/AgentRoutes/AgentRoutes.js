import express from "express";
import {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent

    
} from "../../controllers/AgentController/AgentController.js";

import {authMiddleware} from "../../middleware/authMiddleware.js"
import {permissionMiddleware} from "../../middleware/PermissionMidilewere.js"

const router = express.Router();

// Agent Routes
router.post("/",authMiddleware,permissionMiddleware(), createAgent);
router.get("/",authMiddleware, getAllAgents);
router.get("/:id",authMiddleware, getAgentById);
router.put("/:id",authMiddleware,permissionMiddleware(),updateAgent)
router.delete("/:id",authMiddleware,permissionMiddleware(),deleteAgent)

export default router;