// routes/eventRegistrationRoutes.js
import express from "express";
import {
  getPrefilledRegistrationForm,
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  getAllRegistrationsByEvent,
  updateRegistrationSuspension,
  registerForEventByEventAdmin,
} from "../controllers/eventRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { dynamicEventUpload } from "../middlewares/eventDynamicUploadMiddleware.js";

const router = express.Router();

/* 
========================================================
  Event Registration Routes — Accessible only by "user"
========================================================
*/

// 1 Get Prefilled Registration Form (User or EventAdmin)
router.get(
  "/events/:eventId/prefilled",
  protect,
  authorizeRoles("user", "eventAdmin"),
  getPrefilledRegistrationForm
);

// 2 Register User for an Event (eventId in URL, not body)
router.post(
  "/events/:eventId/register",
  protect,
  authorizeRoles("user"),
  dynamicEventUpload(),
  registerForEvent
);

// 3 Get All Registrations of Logged-in User
router.get(
  "/my/registrations",
  protect,
  authorizeRoles("user"),
  getMyRegistrations
);

// 4 Get a registration by ID
router.get(
  "/registrations/:registrationId",
  protect,
  authorizeRoles("user"),
  getRegistrationById
);

// 5 Get All Paid Registrations for an Event (Event Admin)
router.get(
  "/event-admin/events/:eventId/registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getAllRegistrationsByEvent
);

// 6 Update Registration Suspension Status (Event Admin)
router.patch(
  "/event-admin/registrations/:registrationId/suspension",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationSuspension
);

// 7 Event Admin only :- Register User for an Event (eventId in URL, not body)
router.post(
  "/event-admin/events/:eventId/register",
  protect,
  authorizeRoles("eventAdmin"),
  dynamicEventUpload(),
  registerForEventByEventAdmin
);

export default router;
