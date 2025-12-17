import express from "express";
import {
  registerBanquet,
  getAllPaidBanquetsByEvent,
  editPaidBanquets,
  getAllPaidBanquetsByEvent_Admin,
  updateBanquetSuspension,
  registerBanquetByEventAdmin,
} from "../controllers/banquetRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ========================================================
   Banquet Registration Routes — Accessible only by "user"
======================================================== */

// Register banquet
router.post(
  "/banquet-registrations/:eventId/:eventRegistrationId/register",
  protect,
  authorizeRoles("user"),
  registerBanquet
);

// Get all paid banquets for logged-in user (specific event)
router.get(
  "/banquet-registrations/paid/:eventId",
  protect,
  authorizeRoles("user"),
  getAllPaidBanquetsByEvent
);

// Edit paid banquets (only update otherName)
router.put(
  "/banquet-registrations/:banquetRegistrationId/edit",
  protect,
  authorizeRoles("user"),
  editPaidBanquets
);

// Get all paid banquets for an event (Event Admin)
router.get(
  "/banquet-registrations/event-admin/events/:eventId/paid",
  protect,
  authorizeRoles("eventAdmin"),
  getAllPaidBanquetsByEvent_Admin
);

// Update suspension status of a single banquet (Event Admin)
router.patch(
  "/banquet-registrations/event-admin/:banquetRegistrationId/suspend/:banquetSubId",
  protect,
  authorizeRoles("eventAdmin"),
  updateBanquetSuspension
);

// Register banquet (Event Admin)
router.post(
  "/banquet-registrations/:eventId/register",
  protect,
  authorizeRoles("eventAdmin"),
  registerBanquetByEventAdmin
);


export default router;
