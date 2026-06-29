import express from "express";

import {
  createSpeaker,
  getSpeakersByEvent,
  getActiveSpeakersByEvent,
  getSpeakerById,
  updateSpeaker,
  deleteSpeaker,
} from "../controllers/speakerController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadSpeakerImage,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Speaker
// =======================
router.post(
  "/event-admin/events/:eventId/speakers",
  protect,
  authorizeRoles("eventAdmin"),
  uploadSpeakerImage.single("image"),
  createSpeaker
);

// =======================
// Public/User: Get All Speakers
// =======================
router.get(
  "/events/:eventId/speakers",
  getSpeakersByEvent
);

// =======================
// Public/User: Get Active Speakers
// =======================
router.get(
  "/events/:eventId/speakers/active",
  getActiveSpeakersByEvent
);

// =======================
// Public/User: Get Speaker By Id
// =======================
router.get(
  "/speakers/:id",
  getSpeakerById
);

// =======================
// EventAdmin: Update Speaker
// =======================
router.put(
  "/event-admin/speakers/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadSpeakerImage.single("image"),
  updateSpeaker
);

// =======================
// EventAdmin: Delete Speaker
// =======================
router.delete(
  "/event-admin/speakers/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSpeaker
);

export default router;