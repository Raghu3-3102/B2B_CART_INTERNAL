import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../controllers/UserController/UserController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
const router = express.Router();

router.post("/",authMiddleware, createUser);
router.get("/",authMiddleware, getAllUsers);
router.get("/:id",authMiddleware, getUserById);
router.put("/:id",authMiddleware, updateUser);
router.delete("/:id",authMiddleware,permissionMiddleware(), deleteUser);

export default router;
