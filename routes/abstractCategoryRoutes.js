import express from "express";
import {
  createAbstractCategory,
  getAbstractCategoriesByEvent,
  getActiveAbstractCategoriesByEvent,
  updateAbstractCategory,
  deleteAbstractCategory,
} from "../controllers/abstractCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Abstract Category
// =======================
router.post(
  "/event-admin/events/:eventId/abstract-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createAbstractCategory
);

// =======================
// Public/User: Get All Abstract Categories by Event ID
// =======================
router.get(
  "/events/:eventId/abstract-categories",
  getAbstractCategoriesByEvent
);

// =======================
// Public/User: Get Only Active Abstract Categories by Event ID
// =======================
router.get(
  "/events/:eventId/abstract-categories/active",
  getActiveAbstractCategoriesByEvent
);

// =======================
// EventAdmin: Update Abstract Category
// =======================
router.put(
  "/event-admin/abstract-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAbstractCategory
);

// =======================
// EventAdmin: Delete Abstract Category
// =======================
router.delete(
  "/event-admin/abstract-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAbstractCategory
);

export default router;
