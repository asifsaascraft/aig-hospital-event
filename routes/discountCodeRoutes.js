import express from "express";
import {
  createDiscountCode,
  getDiscountCodesByEvent,
  getActiveDiscountCodesByEvent,
  updateDiscountCode,
  deleteDiscountCode,
} from "../controllers/discountCodeController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Discount Code
// =======================
router.post(
  "/event-admin/events/:eventId/discount-codes",
  protect,
  authorizeRoles("eventAdmin"),
  createDiscountCode
);

// =======================
// Public/User: Get All Discount Codes by Event ID
// =======================
router.get("/events/:eventId/discount-codes", getDiscountCodesByEvent);

// =======================
// Public/User: Get Active Discount Codes
// =======================
router.get("/events/:eventId/active-discount-codes", getActiveDiscountCodesByEvent);

// =======================
// EventAdmin: Update Discount Code
// =======================
router.put(
  "/event-admin/discount-codes/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateDiscountCode
);

// =======================
// EventAdmin: Delete Discount Code
// =======================
router.delete(
  "/event-admin/discount-codes/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteDiscountCode
);

export default router;
