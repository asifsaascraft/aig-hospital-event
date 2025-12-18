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
  createBanquetOrder,
  verifyBanquetPayment,
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


// Create Razorpay Order
router.post(
  "/payments/create-order/:eventId",
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
  "/payments/accompany/create-order/:eventId",
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
  "/payments/workshop/create-order/:eventId",
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

// Banquet Payments
router.post(
  "/payments/banquet/create-order/:eventId",
  protect,
  authorizeRoles("user"),
  createBanquetOrder
);

router.post(
  "/payments/banquet/verify",
  protect,
  authorizeRoles("user"),
  verifyBanquetPayment
);


export default router;
