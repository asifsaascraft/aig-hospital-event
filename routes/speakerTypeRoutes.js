import express from "express";

import {
  createSpeakerType,
  getSpeakerTypesByEvent,
  getActiveSpeakerTypesByEvent,
  updateSpeakerType,
  deleteSpeakerType,
} from "../controllers/speakerTypeController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Speaker Type
// =======================
router.post(
  "/event-admin/events/:eventId/speaker-types",
  protect,
  authorizeRoles("eventAdmin"),
  createSpeakerType
);

// =======================
// Public/User: Get All Speaker Types
// =======================
router.get(
  "/events/:eventId/speaker-types",
  getSpeakerTypesByEvent
);

// =======================
// Public/User: Get Active Speaker Types
// =======================
router.get(
  "/events/:eventId/speaker-types/active",
  getActiveSpeakerTypesByEvent
);

// =======================
// EventAdmin: Update Speaker Type
// =======================
router.put(
  "/event-admin/speaker-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSpeakerType
);

// =======================
// EventAdmin: Delete Speaker Type
// =======================
router.delete(
  "/event-admin/speaker-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSpeakerType
);

export default router;