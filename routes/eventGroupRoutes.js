import express from "express";
import {
  getEventGroups,
  getActiveEventGroups,
  createEventGroup,
  updateEventGroup,
  deleteEventGroup,
} from "../controllers/eventGroupController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Public route
// =======================
router.get("/event-groups", getEventGroups);

// =======================
// Public route - only ACTIVE
// =======================
router.get("/event-groups/active", getActiveEventGroups);

// =======================
// Admin routes
// =======================
router.post(
  "/admin/event-groups",
  protect,
  authorizeRoles("admin"),
  createEventGroup
);

router.put(
  "/admin/event-groups/:id",
  protect,
  authorizeRoles("admin"),
  updateEventGroup
);

router.delete(
  "/admin/event-groups/:id",
  protect,
  authorizeRoles("admin"),
  deleteEventGroup
);

export default router;