import express from "express";
import {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
} from "../../controllers/MemberController/MemberController.js";

import { authMiddleware } from "../../middleware/authMiddleware.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";

const router = express.Router();

// Member Routes
router.post("/", authMiddleware, permissionMiddleware(), createMember);
router.get("/", authMiddleware, getAllMembers);
router.get("/:id", authMiddleware, getMemberById);
router.put("/:id", authMiddleware, permissionMiddleware(), updateMember);
router.delete("/:id", authMiddleware, permissionMiddleware(), deleteMember);

export default router;

