import express from "express";
import {
  createSponsorHall,
  getSponsorHallsByEvent,
  getActiveSponsorHallsByEvent,
  updateSponsorHall,
  deleteSponsorHall,
} from "../controllers/sponsorHallController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Hall
// =======================
router.post(
  "/event-admin/events/:eventId/halls",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorHall
);

// =======================
// Public/User: Get All Halls by Event ID
// =======================
router.get("/events/:eventId/halls", getSponsorHallsByEvent);

// =======================
// Public/User: Get Only Active Halls by Event ID
// =======================
router.get("/events/:eventId/halls/active", getActiveSponsorHallsByEvent);

// =======================
// EventAdmin: Update Hall
// =======================
router.put(
  "/event-admin/halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorHall
);

// =======================
// EventAdmin: Delete Hall
// =======================
router.delete(
  "/event-admin/halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorHall
);

export default router;
