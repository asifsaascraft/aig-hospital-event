// routes/eventRoutes.js
import express from "express";
import {
  getEventCards,
  getEvents,
  getActiveEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  trackEventVisit,
} from "../controllers/eventController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadEventFiles } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public: anyone can view all events (mobile app)
router.get("/event-cards", getEventCards);

// Public: anyone can view all events
router.get("/events", getEvents);

// Public: Get only active events
router.get("/events/active", getActiveEvents);

// Public: Get single event By ID
router.get("/events/:id", getEventById);

// User-only: Visit event
router.post(
  "/events/:eventId/visit",
  protect,
  authorizeRoles("user"),
  trackEventVisit
);


// Admin-only: Create a new event
router.post(
  "/admin/events",
  protect,
  authorizeRoles("admin"),
  (req, res, next) => {
    uploadEventFiles.fields([
      { name: "eventImage", maxCount: 1 },
      { name: "brochureUpload", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  }, 
  createEvent
);

// Admin-only: Update an event
router.put(
  "/admin/events/:id",
  protect,
  authorizeRoles("admin"),
  (req, res, next) => {
    uploadEventFiles.fields([
      { name: "eventImage", maxCount: 1 },
      { name: "brochureUpload", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });


      }
      next();
    });
  },
  updateEvent
);

// Admin-only: Update event active status
router.patch(
  "/admin/events/:id/status",
  protect,
  authorizeRoles("admin"),
  updateEventStatus
);

// Admin-only: Delete an event
router.delete(
  "/admin/events/:id",
  protect,
  authorizeRoles("admin"),
  deleteEvent
);



export default router;
