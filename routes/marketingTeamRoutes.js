import express from "express";
import {
  getMarketingTeams,
  getActiveMarketingTeams,
  createMarketingTeam,
  updateMarketingTeam,
  deleteMarketingTeam,
} from "../controllers/marketingTeamController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/marketing-teams", getMarketingTeams);

router.get("/marketing-teams/active", getActiveMarketingTeams);

// Admin Routes
router.post(
  "/admin/marketing-teams",
  protect,
  authorizeRoles("admin"),
  createMarketingTeam
);

router.put(
  "/admin/marketing-teams/:id",
  protect,
  authorizeRoles("admin"),
  updateMarketingTeam
);

router.delete(
  "/admin/marketing-teams/:id",
  protect,
  authorizeRoles("admin"),
  deleteMarketingTeam
);

export default router;