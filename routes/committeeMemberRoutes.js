import express from "express";

import {
  createCommitteeMember,
  getCommitteeMembersByEvent,
  getActiveCommitteeMembersByEvent,
  getCommitteeMemberById,
  updateCommitteeMember,
  deleteCommitteeMember,
} from "../controllers/committeeMemberController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadCommitteeMemberImage,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Committee Member
// =======================
router.post(
  "/event-admin/events/:eventId/committee-members",
  protect,
  authorizeRoles("eventAdmin"),
  uploadCommitteeMemberImage.single("image"),
  createCommitteeMember
);

// =======================
// Public/User: Get All Committee Members
// =======================
router.get(
  "/events/:eventId/committee-members",
  getCommitteeMembersByEvent
);

// =======================
// Public/User: Get Active Committee Members
// =======================
router.get(
  "/events/:eventId/committee-members/active",
  getActiveCommitteeMembersByEvent
);

// =======================
// Get Committee Member By Id
// =======================
router.get(
  "/committee-members/:id",
  getCommitteeMemberById
);

// =======================
// EventAdmin: Update Committee Member
// =======================
router.put(
  "/event-admin/committee-members/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadCommitteeMemberImage.single("image"),
  updateCommitteeMember
);

// =======================
// EventAdmin: Delete Committee Member
// =======================
router.delete(
  "/event-admin/committee-members/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteCommitteeMember
);

export default router;