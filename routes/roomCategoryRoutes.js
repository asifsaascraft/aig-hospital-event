// routes/roomCategoryRoutes.js
import express from "express";
import {
  getRoomCategories,
  getActiveRoomCategories,
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

// Event Admin: Get only ACTIVE room categories
router.get(
  "/room-categories/active",
  protect,
  authorizeRoles("eventAdmin"),
  getActiveRoomCategories
);
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
