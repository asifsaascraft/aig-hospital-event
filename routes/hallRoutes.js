import express from "express";
import {
  createHall,
  getHallsByEvent,
  updateHall,
  deleteHall,
} from "../controllers/hallController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Hall
// =======================
router.post(
  "/event-admin/events/:eventId/halls",
  protect,
  authorizeRoles("eventAdmin"),
  createHall
);

// =======================
// Public/User: Get All Halls by Event ID
// =======================
router.get("/events/:eventId/halls", getHallsByEvent);

// =======================
// EventAdmin: Update Hall
// =======================
router.put(
  "/event-admin/halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateHall
);

// =======================
// EventAdmin: Delete Hall
// =======================
router.delete(
  "/event-admin/halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteHall
);

export default router;
