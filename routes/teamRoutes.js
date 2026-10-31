// routes/teamRoutes.js
import express from "express";
import {
  getTeams,
  getAllActiveTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Public: Get all teams (eventAdmins)
// =======================
router.get("/teams", getTeams);

// =======================
// Get all active teams
// =======================
router.get("/teams/active", getAllActiveTeams);

// =======================
// Admin-only: Create a new team (eventAdmin user)
// =======================
router.post(
  "/admin/teams",
  protect,
  authorizeRoles("admin"),
  createTeam
);

// =======================
// Admin-only: Update team by ID (eventAdmin user)
// =======================
router.put(
  "/admin/teams/:id",
  protect,
  authorizeRoles("admin"),
  updateTeam
);

// =======================
// Admin-only: Delete team by ID (eventAdmin user)
// =======================
router.delete(
  "/admin/teams/:id",
  protect,
  authorizeRoles("admin"),
  deleteTeam
);

export default router;
