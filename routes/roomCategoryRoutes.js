import express from "express";

import {
  getRoomCategories,
  getActiveRoomCategories,
  getRoomCategoryById,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
} from "../controllers/roomCategoryController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// anyone logged-in can view
// =======================
router.get("/room-categories", protect, getRoomCategories);

router.get(
  "/room-categories/active",
  protect,
  getActiveRoomCategories
);

router.get(
  "/room-categories/:id",
  protect,
  getRoomCategoryById
);

// =======================
// Admin Routes
// =======================
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