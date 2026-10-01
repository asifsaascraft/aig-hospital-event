import express from "express";
import {
  createTravel,
  getTravelByEvent,
  updateTravel,
  deleteTravel,
} from "../controllers/travelController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadTravelFiles } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Travel
// =======================
router.post(
  "/event-admin/events/:eventId/travel",
  protect,
  authorizeRoles("eventAdmin"),
  uploadTravelFiles.fields([
    { name: "idUpload", maxCount: 1 },
    { name: "travelPlanUpload", maxCount: 1 },
  ]),
  createTravel,
);

// =======================
// Public/User: Get Travel Bookings by Event
// =======================
router.get("/events/:eventId/travel", getTravelByEvent);

// =======================
// EventAdmin: Update Travel
// =======================
router.put(
  "/event-admin/travel/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadTravelFiles.fields([
    { name: "idUpload", maxCount: 1 },
    { name: "travelPlanUpload", maxCount: 1 },
  ]),
  updateTravel,
);

// =======================
// EventAdmin: Delete Travel
// =======================
router.delete(
  "/event-admin/travel/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteTravel,
);

export default router;
