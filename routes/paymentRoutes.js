// routes/paymentRoutes.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyPayments,
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
========================================================
  Payment Routes — User Only
========================================================
*/

// Create Razorpay Order
router.post(
  "/payments/create-order",
  protect,
  authorizeRoles("user"),
  createOrder
);

// Verify Razorpay Payment
router.post(
  "/payments/verify",
  protect,
  authorizeRoles("user"),
  verifyPayment
);

// Get All My Payments
router.get(
  "/payments/my",
  protect,
  authorizeRoles("user"),
  getMyPayments
);

export default router;
