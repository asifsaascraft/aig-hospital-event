import express from "express";

import {
  createPoll,
  getPollsByEvent,
  getPollById,
  updatePoll,
  deletePoll,
} from "../controllers/pollController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Poll
// =======================
router.post(
  "/event-admin/events/:eventId/polls",
  protect,
  authorizeRoles("eventAdmin"),
  createPoll
);

// =======================
// Public/User: Get All Polls
// =======================
router.get(
  "/events/:eventId/polls",
  getPollsByEvent
);

// =======================
// Public/User: Get Poll By Id
// =======================
router.get(
  "/polls/:id",
  getPollById
);

// =======================
// EventAdmin: Update Poll
// =======================
router.put(
  "/event-admin/polls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updatePoll
);

// =======================
// EventAdmin: Delete Poll
// =======================
router.delete(
  "/event-admin/polls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deletePoll
);

export default router;