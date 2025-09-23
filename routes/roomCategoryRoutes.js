// routes/roomCategoryRoutes.js
import express from "express";
import {
  getRoomCategories,
  getRoomCategoryById,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
} from "../controllers/roomCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Logged-in users can view room categories
router.get("/room-categories", protect, getRoomCategories);
router.get("/room-categories/:id", protect, getRoomCategoryById);

// Admin-only: Create, Update, Delete
router.post(
  "/admin/room-categories",
  protect,
  authorizeRoles("admin"),
  createRoomCategory
);

router.put(
  "/admin/room-categories/:id",
  protect,
  authorizeRoles("admin"),
  updateRoomCategory
);

router.delete(
  "/admin/room-categories/:id",
  protect,
  authorizeRoles("admin"),
  deleteRoomCategory
);

export default router;
