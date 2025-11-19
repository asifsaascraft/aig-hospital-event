import express from "express";
import {
  createExhibitor,
  getExhibitorsByEvent,
  getActiveExhibitorsByEvent,
  updateExhibitor,
  deleteExhibitor,
} from "../controllers/exhibitorController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Exhibitor
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitors",
  protect,
  authorizeRoles("eventAdmin"),
  createExhibitor
);

// =======================
// Public/User: Get All Exhibitors by Event ID
// =======================
router.get(
  "/events/:eventId/exhibitors", 
  getExhibitorsByEvent
);

// =======================
// Public/User: Get Active Exhibitors by Event ID
// =======================
router.get(
  "/events/:eventId/exhibitors/active", 
  getActiveExhibitorsByEvent
);

// =======================
// EventAdmin: Update Exhibitor
// =======================
router.put(
  "/event-admin/exhibitors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExhibitor
);

// =======================
// EventAdmin: Delete Exhibitor
// =======================
router.delete(
  "/event-admin/exhibitors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitor
);

export default router;
