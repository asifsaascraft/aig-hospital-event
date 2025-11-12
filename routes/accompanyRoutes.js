// routes/accompanyRoutes.js
import express from "express";
import {
  getAccompanyAmount,
  addAccompanies,
  getAllPaidAccompaniesByEvent,
  editPaidAccompanies,
  getAllPaidAccompaniesByEvent_Admin,
  updateAccompanySuspension,
} from "../controllers/accompanyController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ========================================================
   Accompany Routes — Accessible only by "user"
======================================================== */

//  Get accompany amount by event + registration
router.get(
  "/accompanies/:eventId/:eventRegistrationId/amount",
  protect,
  authorizeRoles("user"),
  getAccompanyAmount
);

// Add accompanies after registration
router.post(
  "/accompanies/:eventId/:eventRegistrationId/add",
  protect,
  authorizeRoles("user"),
  addAccompanies
);

// Get all paid accompanies for logged-in user (specific event)
router.get(
  "/accompanies/paid/events/:eventId",
  protect,
  authorizeRoles("user"),
  getAllPaidAccompaniesByEvent
);

// Edit paid accompanies (only editable fields)
router.put(
  "/accompanies/:accompanyId/edit",
  protect,
  authorizeRoles("user"),
  editPaidAccompanies
);

//  Get all paid accompanies for an event (Event Admin)
router.get(
  "/accompanies/event-admin/events/:eventId/paid",
  protect,
  authorizeRoles("eventAdmin"),
  getAllPaidAccompaniesByEvent_Admin
);

// Update suspension status of a single accompany (Event Admin)
router.patch(
  "/accompanies/event-admin/:accompanyId/suspend/:subId",
  protect,
  authorizeRoles("eventAdmin"),
  updateAccompanySuspension
);


export default router;
