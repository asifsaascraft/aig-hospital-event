// routes/eventRegistrationRoutes.js
import express from "express";
import {
  getPrefilledRegistrationForm,
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
} from "../controllers/eventRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* 
========================================================
  Event Registration Routes — Accessible only by "user"
========================================================
*/

// 1️ Get Prefilled Registration Form for a Particular Event
router.get(
  "/events/:eventId/prefilled",
  protect,
  authorizeRoles("user"),
  getPrefilledRegistrationForm
);

// 2️ Register User for an Event (eventId in URL, not body)
router.post(
  "/events/:eventId/register",
  protect,
  authorizeRoles("user"),
  registerForEvent
);

// 3️ Get All Registrations of Logged-in User
router.get(
  "/my/registrations",
  protect,
  authorizeRoles("user"),
  getMyRegistrations
);

// Get a registration by ID
router.get(
  "/registrations/:id",
  protect,
  authorizeRoles("user"),
  getRegistrationById
);

export default router;
