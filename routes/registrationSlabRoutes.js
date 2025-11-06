import express from "express";
import {
  createRegistrationSlab,
  getRegistrationSlabsByEvent,
  getActiveRegistrationSlabsByEvent,
  deleteRegistrationSlab,
  updateRegistrationSlab,
} from "../controllers/registrationSlabController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Registration Slab
// =======================
router.post(
  "/event-admin/events/:eventId/slabs",
  protect,
  authorizeRoles("eventAdmin"),
  createRegistrationSlab
);

// =======================
// Public/User: Get All Registration Slabs by Event ID
// =======================
router.get("/events/:eventId/slabs", getRegistrationSlabsByEvent);

// =======================
// Public/User: Get Active Registration Slabs by Event ID
// =======================
router.get("/events/:eventId/slabs/active", getActiveRegistrationSlabsByEvent);


// =======================
// EventAdmin: Update Registration Slab
// =======================
router.put(
  "/event-admin/slabs/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationSlab
);


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
