import express from "express";
import {
  createCardProfile,
  getCardProfilesByEvent,
  getActiveCardProfilesByEvent,
  updateCardProfile,
  deleteCardProfile,
} from "../controllers/cardProfileController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create
router.post(
  "/event-admin/events/:eventId/card-profiles",
  protect,
  authorizeRoles("eventAdmin"),
  createCardProfile
);

// Get all
router.get(
  "/events/:eventId/card-profiles",
  getCardProfilesByEvent
);

// Get active
router.get(
  "/events/:eventId/card-profiles/active",
  getActiveCardProfilesByEvent
);

// Update
router.put(
  "/event-admin/card-profiles/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateCardProfile
);

// Delete
router.delete(
  "/event-admin/card-profiles/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteCardProfile
);

export default router;