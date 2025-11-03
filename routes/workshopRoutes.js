import express from "express";
import {
  createWorkshop,
  getWorkshopsByEvent,
  getActiveWorkshopsByEvent,
  updateWorkshop,
  deleteWorkshop,
} from "../controllers/workshopController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Workshop
// =======================
router.post(
  "/event-admin/events/:eventId/workshops",
  protect,
  authorizeRoles("eventAdmin"),
  createWorkshop
);

// =======================
// Public/User: Get All Workshops by Event ID
// =======================
router.get("/events/:eventId/workshops", getWorkshopsByEvent);

// =======================
// Public/User: Get Only Active Workshops by Event ID
// =======================
router.get("/events/:eventId/active-workshops", getActiveWorkshopsByEvent);


// =======================
// EventAdmin: Update Workshop
// =======================
router.put(
  "/event-admin/workshops/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateWorkshop
);

// =======================
// EventAdmin: Delete Workshop
// =======================
router.delete(
  "/event-admin/workshops/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteWorkshop
);

export default router;
