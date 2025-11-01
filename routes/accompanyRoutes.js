// routes/accompanyRoutes.js
import express from "express";
import {
  getAccompanyAmount,
  addAccompanies,
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

export default router;
