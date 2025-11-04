// routes/paymentRoutes.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  markPaymentFailed,
  createAccompanyOrder,
  verifyAccompanyPayment,
  createWorkshopOrder,
  verifyWorkshopPayment,
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

// Mark Payment as Failed
router.post(
  "/payments/failed",
  protect,
  authorizeRoles("user"),
  markPaymentFailed
);

// Accompany Payments
router.post(
  "/payments/accompany/create-order",
  protect,
  authorizeRoles("user"),
  createAccompanyOrder
);
router.post(
  "/payments/accompany/verify",
  protect,
  authorizeRoles("user"),
  verifyAccompanyPayment
);

// Workshop Payments
router.post(
  "/payments/workshop/create-order",
  protect,
  authorizeRoles("user"),
  createWorkshopOrder
);

router.post(
  "/payments/workshop/verify",
  protect,
  authorizeRoles("user"),
  verifyWorkshopPayment
);


export default router;
