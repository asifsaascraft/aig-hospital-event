import express from "express";
import {
  getOtherTeams,
  getActiveOtherTeams,
  createOtherTeam,
  updateOtherTeam,
  deleteOtherTeam,
} from "../controllers/otherTeamController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Public Routes
// =======================
router.get("/other-teams", getOtherTeams);

router.get("/other-teams/active", getActiveOtherTeams);

// =======================
// Admin Routes
// =======================
router.post(
  "/admin/other-teams",
  protect,
  authorizeRoles("admin"),
  createOtherTeam
);

router.put(
  "/admin/other-teams/:id",
  protect,
  authorizeRoles("admin"),
  updateOtherTeam
);

router.delete(
  "/admin/other-teams/:id",
  protect,
  authorizeRoles("admin"),
  deleteOtherTeam
);

export default router;