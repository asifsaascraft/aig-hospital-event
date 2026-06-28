import express from "express";

import {
  createMessage,
  getMessageByEvent,
  getMessageById,
  updateMessage,
  deleteMessage,
} from "../controllers/messageController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadMessageImages,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// Get Message By Event (Public)
// =======================
router.get(
  "/events/:eventId/message",
  getMessageByEvent
);

// =======================
// Get Message By Id
// =======================
router.get(
  "/message/:id",
  getMessageById
);

// =======================
// EventAdmin: Create Message
// Only one message allowed per event
// =======================
router.post(
  "/event-admin/events/:eventId/message",
  protect,
  authorizeRoles("eventAdmin"),
  uploadMessageImages.array("images", 10),
  createMessage
);

// =======================
// EventAdmin: Update Message
// =======================
router.put(
  "/event-admin/message/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadMessageImages.array("images", 10),
  updateMessage
);

// =======================
// EventAdmin: Delete Message
// =======================
router.delete(
  "/event-admin/message/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteMessage
);

export default router;