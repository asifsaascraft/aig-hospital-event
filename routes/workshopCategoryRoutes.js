import express from "express";
import {
  createWorkshopCategory,
  getWorkshopCategoriesByEvent,
  getActiveWorkshopCategoriesByEvent,
  updateWorkshopCategory,
  deleteWorkshopCategory,
} from "../controllers/workshopCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Workshop Category
// =======================
router.post(
  "/event-admin/events/:eventId/workshop-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createWorkshopCategory
);

// =======================
// Public/User: Get All Workshop Categories by Event ID
// =======================
router.get("/events/:eventId/workshop-categories", getWorkshopCategoriesByEvent);

// =======================
// Public/User: Get Only Active Workshop Categories by Event ID
// =======================
router.get(
  "/events/:eventId/workshop-categories/active",
  getActiveWorkshopCategoriesByEvent
);

// =======================
// EventAdmin: Update Workshop Category
// =======================
router.put(
  "/event-admin/workshop-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateWorkshopCategory
);

// =======================
// EventAdmin: Delete Workshop Category
// =======================
router.delete(
  "/event-admin/workshop-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteWorkshopCategory
);

export default router;
