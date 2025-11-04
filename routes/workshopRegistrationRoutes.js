// routes/workshopRegistrationRoutes.js
import express from "express";
import {
  registerForWorkshops,
  getUserWorkshopRegistrations,
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

// 2️ Get All Completed Workshop Registrations of Logged-in User
router.get(
  "/my-registrations",
  protect,
  authorizeRoles("user"),
  getUserWorkshopRegistrations
);

export default router;
