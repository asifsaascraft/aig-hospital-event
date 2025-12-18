import express from "express";
import {
  registerForWorkshops,
  getUserWorkshopRegistrationsByEvent,
  getAllWorkshopRegistrationsByEvent,
  updateWorkshopSuspension,
  registerForWorkshopsByEventAdmin,
} from "../controllers/workshopRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ========================================================
   Workshop Registration Routes
======================================================== */

// 1️ Register for Multiple Workshops under a Single Event
router.post(
  "/events/:eventId/workshop-register",
  protect,
  authorizeRoles("user"),
  registerForWorkshops
);

// 2️ Get Completed Workshop Registrations for Specific Event
router.get(
  "/my-registrations/event/:eventId",
  protect,
  authorizeRoles("user"),
  getUserWorkshopRegistrationsByEvent
);

// 3️ Get All Valid Workshop Registrations for an Event (Event Admin)
router.get(
  "/event-admin/events/:eventId/workshop-registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getAllWorkshopRegistrationsByEvent
);

// 4️ Update Suspension Status of a Single Workshop (Event Admin)
router.patch(
  "/workshop-registrations/event-admin/:registrationId/suspend/:subId",
  protect,
  authorizeRoles("eventAdmin"),
  updateWorkshopSuspension
);

// 5 Register for Multiple Workshops under a Single Event (Event Admin)
router.post(
  "/event-admin/events/:eventId/workshop-register",
  protect,
  authorizeRoles("eventAdmin"),
  registerForWorkshopsByEventAdmin
);
export default router;
