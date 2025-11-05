// routes/workshopRegistrationRoutes.js
import express from "express";
import {
  registerForWorkshops,
  getUserWorkshopRegistrationsByEvent,
} from "../controllers/workshopRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* 
========================================================
  Workshop Registration Routes — Accessible only by "user"
========================================================
*/

// 1️ Register for Multiple Workshops under a Single Event (eventId in URL)
router.post(
  "/events/:eventId/workshop-register",
  protect,
  authorizeRoles("user"),
  registerForWorkshops
);

// 2 Get Completed Workshop Registrations for Specific Event
router.get(
  "/my-registrations/event/:eventId",
  protect,
  authorizeRoles("user"),
  getUserWorkshopRegistrationsByEvent
);

export default router;
