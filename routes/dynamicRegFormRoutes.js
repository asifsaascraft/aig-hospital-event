import express from "express";
import {
  createDynamicRegForm,
  getDynamicRegFormByEvent,
  updateDynamicRegForm,
  deleteDynamicRegForm
} from "../controllers/dynamicRegFormController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Dynamic Form (Only Once)
// =======================
router.post(
  "/event-admin/events/:eventId/dynamic-form",
  protect,
  authorizeRoles("eventAdmin"),
  createDynamicRegForm
);

// =======================
// Public / Event User: Fetch Form
// =======================
router.get("/events/:eventId/dynamic-form", getDynamicRegFormByEvent);

// =======================
// EventAdmin: Update Form
// =======================
router.put(
  "/event-admin/dynamic-form/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateDynamicRegForm
);

// =======================
// EventAdmin: Delete Form
// =======================
router.delete(
  "/event-admin/dynamic-form/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteDynamicRegForm
);

export default router;
