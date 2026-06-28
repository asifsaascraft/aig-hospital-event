import express from "express";

import {
  createCommitteeType,
  getCommitteeTypesByEvent,
  getActiveCommitteeTypesByEvent,
  updateCommitteeType,
  deleteCommitteeType,
} from "../controllers/committeeTypeController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Committee Type
// =======================
router.post(
  "/event-admin/events/:eventId/committee-types",
  protect,
  authorizeRoles("eventAdmin"),
  createCommitteeType
);

// =======================
// Public/User: Get All Committee Types
// =======================
router.get(
  "/events/:eventId/committee-types",
  getCommitteeTypesByEvent
);

// =======================
// Public/User: Get Active Committee Types
// =======================
router.get(
  "/events/:eventId/committee-types/active",
  getActiveCommitteeTypesByEvent
);

// =======================
// EventAdmin: Update Committee Type
// =======================
router.put(
  "/event-admin/committee-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateCommitteeType
);

// =======================
// EventAdmin: Delete Committee Type
// =======================
router.delete(
  "/event-admin/committee-types/:id",
  protect,
 authorizeRoles("eventAdmin"),
  deleteCommitteeType
);

export default router;