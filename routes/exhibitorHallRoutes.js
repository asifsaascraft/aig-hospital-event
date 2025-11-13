import express from "express";
import {
  createExhibitorHall,
  getExhibitorHallsByEvent,
  getActiveExhibitorHallsByEvent,
  updateExhibitorHall,
  deleteExhibitorHall,
} from "../controllers/exhibitorHallController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Hall
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitor-halls",
  protect,
  authorizeRoles("eventAdmin"),
  createExhibitorHall
);

// =======================
// Public/User: Get All Halls by Event ID
// =======================
router.get("/events/:eventId/exhibitor-halls", getExhibitorHallsByEvent);

// =======================
// Public/User: Get Only Active Halls by Event ID
// =======================
router.get(
  "/events/:eventId/exhibitor-halls/active",
  getActiveExhibitorHallsByEvent
);

// =======================
// EventAdmin: Update Hall
// =======================
router.put(
  "/event-admin/exhibitor-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExhibitorHall
);

// =======================
// EventAdmin: Delete Hall
// =======================
router.delete(
  "/event-admin/exhibitor-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitorHall
);

export default router;
