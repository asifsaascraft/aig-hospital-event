import express from "express";
import {
  createTermsAndCondition,
  getTermsAndConditionsByEvent,
  updateTermsAndCondition,
  deleteTermsAndCondition,
} from "../controllers/termsAndConditionController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Terms & Conditions
// =======================
router.post(
  "/event-admin/events/:eventId/terms-and-conditions",
  protect,
  authorizeRoles("eventAdmin"),
  createTermsAndCondition
);

// =======================
// Public/User: Get All Terms & Conditions by Event ID
// =======================
router.get("/events/:eventId/terms-and-conditions", getTermsAndConditionsByEvent);

// =======================
// EventAdmin: Update Terms & Conditions
// =======================
router.put(
  "/event-admin/terms-and-conditions/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateTermsAndCondition
);

// =======================
// EventAdmin: Delete Terms & Conditions
// =======================
router.delete(
  "/event-admin/terms-and-conditions/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteTermsAndCondition
);

export default router;
