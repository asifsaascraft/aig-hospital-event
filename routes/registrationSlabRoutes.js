import express from "express";
import {
  createRegistrationSlab,
  getRegistrationSlabsByEvent,
  deleteRegistrationSlab,
} from "../controllers/registrationSlabController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Registration Slab
// =======================
router.post(
  "/event-admin/slabs",
  protect,
  authorizeRoles("eventAdmin"),
  createRegistrationSlab
);

// =======================
// Public/User: Get All Registration Slabs by Event ID
// =======================
router.get("/events/:eventId/slabs", getRegistrationSlabsByEvent);

// =======================
// EventAdmin: Delete Registration Slab
// =======================
router.delete(
  "/event-admin/slabs/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteRegistrationSlab
);

export default router;
