import express from "express";
import {
  registerBanquet,
  getAllPaidBanquetsByEvent,
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

export default router;
