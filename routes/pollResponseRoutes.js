import express from "express";

import {
  submitPollResponse,
  getPollResult,
  getMyPollResponse,
  getPollResponsesByPoll,
  getPollSummaryByEvent,
  getPollResponseCount,
} from "../controllers/pollResponseController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================================
// User: Submit Poll Response
// =======================================
router.post(
  "/user/events/:eventId/polls/submit",
  protect,
  authorizeRoles("user"),
  submitPollResponse,
);

// =======================================
// User: Get Poll Result
// =======================================
router.get(
  "/user/events/:eventId/polls/:pollId/result",
  protect,
  authorizeRoles("user"),
  getPollResult,
);

// =======================
// Get All My Poll Responses by event (User)
// =======================
router.get(
  "/user/events/:eventId/polls/:pollId/my-response",
  protect,
  authorizeRoles("user"),
  getMyPollResponse
);

// =======================================
// Public: Get All Responses of One Poll
// =======================================
router.get(
  "/events/:eventId/polls/:pollId/responses",
  getPollResponsesByPoll,
);

// =======================================
// Public: Event Wise Poll Summary
// =======================================
router.get(
  "/events/:eventId/poll-summary",
  getPollSummaryByEvent,
);


// =======================
// Get All count Poll Responses By Event (Public)
// =======================
router.get(
  "/events/:eventId/polls/:pollId/count",
  getPollResponseCount
);

export default router;
