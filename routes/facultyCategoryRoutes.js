import express from "express";
import {
  createFacultyCategory,
  getFacultyCategoriesByEvent,
  getActiveFacultyCategoriesByEvent,
  updateFacultyCategory,
  deleteFacultyCategory,
} from "../controllers/facultyCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Faculty Category
// =======================
router.post(
  "/event-admin/events/:eventId/faculty-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createFacultyCategory
);

// =======================
// Public/User: Get All Faculty Categories by Event ID
// =======================
router.get(
  "/events/:eventId/faculty-categories",
  getFacultyCategoriesByEvent
);

// =======================
// Public/User: Get Only Active Faculty Categories by Event ID
// =======================
router.get(
  "/events/:eventId/faculty-categories/active",
  getActiveFacultyCategoriesByEvent
);

// =======================
// EventAdmin: Update Faculty Category
// =======================
router.put(
  "/event-admin/faculty-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateFacultyCategory
);

// =======================
// EventAdmin: Delete Faculty Category
// =======================
router.delete(
  "/event-admin/faculty-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteFacultyCategory
);

export default router;
