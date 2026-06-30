import express from "express";

import {
  createExhibitorType,
  getExhibitorTypesByEvent,
  getActiveExhibitorTypesByEvent,
  updateExhibitorType,
  deleteExhibitorType,
} from "../controllers/exhibitorTypeController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Exhibitor Type
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitor-types",
  protect,
  authorizeRoles("eventAdmin"),
  createExhibitorType
);

// =======================
// Public/User: Get All Exhibitor Types
// =======================
router.get(
  "/events/:eventId/exhibitor-types",
  getExhibitorTypesByEvent
);

// =======================
// Public/User: Get Active Exhibitor Types
// =======================
router.get(
  "/events/:eventId/exhibitor-types/active",
  getActiveExhibitorTypesByEvent
);

// =======================
// EventAdmin: Update Exhibitor Type
// =======================
router.put(
  "/event-admin/exhibitor-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExhibitorType
);

// =======================
// EventAdmin: Delete Exhibitor Type
// =======================
router.delete(
  "/event-admin/exhibitor-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitorType
);

export default router;