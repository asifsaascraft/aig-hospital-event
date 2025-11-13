import express from "express";
import {
  createExhibitorCategory,
  getExhibitorCategoriesByEvent,
  getActiveExhibitorCategoriesByEvent,
  updateExhibitorCategory,
  deleteExhibitorCategory,
} from "../controllers/exhibitorCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Exhibitor Category
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitor-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createExhibitorCategory
);

// =======================
// Public/User: Get All Exhibitor Categories by Event ID
// =======================
router.get("/events/:eventId/exhibitor-categories", getExhibitorCategoriesByEvent);

// =======================
// Public/User: Get Active Exhibitor Categories by Event ID
// =======================
router.get(
  "/events/:eventId/exhibitor-categories/active",
  getActiveExhibitorCategoriesByEvent
);

// =======================
// EventAdmin: Update Exhibitor Category
// =======================
router.put(
  "/event-admin/exhibitor-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExhibitorCategory
);

// =======================
// EventAdmin: Delete Exhibitor Category
// =======================
router.delete(
  "/event-admin/exhibitor-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitorCategory
);

export default router;
