import express from "express";
import {
  createBanquet,
  getBanquetsByEvent,
  getActiveBanquetsByEvent,
  updateBanquet,
  deleteBanquet,
} from "../controllers/banquetController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Banquet
// =======================
router.post(
  "/event-admin/events/:eventId/banquets",
  protect,
  authorizeRoles("eventAdmin"),
  createBanquet
);

// =======================
// Public/User: Get All Banquets by Event ID
// =======================
router.get("/events/:eventId/banquets", getBanquetsByEvent);

// =======================
// Public/User: Get Active Banquets by Event ID
// =======================
router.get("/events/:eventId/banquets/active", getActiveBanquetsByEvent);

// =======================
// EventAdmin: Update Banquet
// =======================
router.put(
  "/event-admin/banquets/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateBanquet
);

// =======================
// EventAdmin: Delete Banquet
// =======================
router.delete(
  "/event-admin/banquets/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteBanquet
);

export default router;
