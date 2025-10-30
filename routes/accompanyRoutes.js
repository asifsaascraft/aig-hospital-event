// routes/accompanyRoutes.js
import express from "express";
import {
  addAccompanies,
  getMyAccompanies,
  markAccompanyPaid,
} from "../controllers/accompanyController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ========================================================
   Accompany Routes — Accessible only by "user"
======================================================== */

// 1️ Add Accompanies for a Registration
router.post(
  "/events/:eventId/:eventRegistrationId/accompanies",
  protect,
  authorizeRoles("user"),
  addAccompanies
);

// 2️ Get My Accompanies for a Registration
router.get(
  "/events/:eventId/:eventRegistrationId/accompanies",
  protect,
  authorizeRoles("user"),
  getMyAccompanies
);

// 3️ Mark Accompanies Paid
router.patch(
  "/accompanies/:accompanyId/mark-paid",
  protect,
  authorizeRoles("user"),
  markAccompanyPaid
);

export default router;
