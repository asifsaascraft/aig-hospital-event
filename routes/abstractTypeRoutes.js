import express from "express";
import {
  createAbstractType,
  getAbstractTypesByEvent,
  getActiveAbstractTypesByEvent,
  updateAbstractType,
  deleteAbstractType,
} from "../controllers/abstractTypeController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Abstract Type
// =======================
router.post(
  "/event-admin/events/:eventId/abstract-types",
  protect,
  authorizeRoles("eventAdmin"),
  createAbstractType
);

// =======================
// Public/User: Get All Abstract Types by Event ID
// =======================
router.get("/events/:eventId/abstract-types", getAbstractTypesByEvent);

// =======================
// Public/User: Get Only Active Abstract Types by Event ID
// =======================
router.get(
  "/events/:eventId/abstract-types/active",
  getActiveAbstractTypesByEvent
);

// =======================
// EventAdmin: Update Abstract Type
// =======================
router.put(
  "/event-admin/abstract-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAbstractType
);

// =======================
// EventAdmin: Delete Abstract Type
// =======================
router.delete(
  "/event-admin/abstract-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAbstractType
);

export default router;
