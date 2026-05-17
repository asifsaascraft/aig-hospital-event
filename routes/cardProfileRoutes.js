import express from "express";

import {
  createCardProfile,
  getCardProfiles,
  getActiveCardProfiles,
  updateCardProfile,
  deleteCardProfile,
} from "../controllers/cardProfileController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create
router.post(
  "/event-admin/card-profiles",
  protect,
  authorizeRoles("eventAdmin"),
  createCardProfile
);

// Get all
router.get(
  "/card-profiles",
  getCardProfiles
);

// Get active
router.get(
  "/card-profiles/active",
  getActiveCardProfiles
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