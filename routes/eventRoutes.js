// routes/eventRoutes.js
import express from "express";
import {
  getEvents,
  getLiveEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadEventImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public: anyone can view all events
router.get("/events", getEvents);
// Public: Get all live events
router.get("/events/live", getLiveEvents);

router.get("/events/:id", getEventById);

// Admin-only: Create a new event
router.post(
  "/admin/events",
  protect,
  authorizeRoles("admin"),
  uploadEventImage.single("eventImage"),
  createEvent
);

// Admin-only: Update an event
router.put(
  "/admin/events/:id",
  protect,
  authorizeRoles("admin"),
  uploadEventImage.single("eventImage"),
  updateEvent
);

// Admin-only: Delete an event
router.delete(
  "/admin/events/:id",
  protect,
  authorizeRoles("admin"),
  deleteEvent
);

export default router;
