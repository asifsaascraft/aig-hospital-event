import express from "express";
import {
  assignTravelToMarketingTeam,
  getUnassignedTravels,
  getMarketingTeamTravelSummary,
} from "../controllers/marketingTeamTravelController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Assign
router.post(
  "/event-admin/events/:eventId/assign-travel",
  protect,
  authorizeRoles("eventAdmin"),
  assignTravelToMarketingTeam
);

// Get Unassigned
router.get(
  "/event-admin/events/:eventId/unassigned-travels",
  protect,
  authorizeRoles("eventAdmin"),
  getUnassignedTravels
);

// Summary
router.get(
  "/event-admin/events/:eventId/marketing-team-summary",
  protect,
  authorizeRoles("eventAdmin"),
  getMarketingTeamTravelSummary
);

export default router;