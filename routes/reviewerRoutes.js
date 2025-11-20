import express from "express";
import {
  createReviewer,
  getReviewersByEvent,
  getActiveReviewersByEvent,
  updateReviewer,
  deleteReviewer,
} from "../controllers/reviewerController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Reviewer
// =======================
router.post(
  "/event-admin/events/:eventId/reviewers",
  protect,
  authorizeRoles("eventAdmin"),
  createReviewer
);

// =======================
// Public/User: Get All Reviewers by Event ID
// =======================
router.get(
  "/events/:eventId/reviewers",
  getReviewersByEvent
);

// =======================
// Public/User: Get Active Reviewers by Event ID
// =======================
router.get(
  "/events/:eventId/reviewers/active",
  getActiveReviewersByEvent
);

// =======================
// EventAdmin: Update Reviewer
// =======================
router.put(
  "/event-admin/reviewers/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateReviewer
);

// =======================
// EventAdmin: Delete Reviewer
// =======================
router.delete(
  "/event-admin/reviewers/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteReviewer
);

export default router;
