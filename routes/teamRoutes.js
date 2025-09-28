// routes/teamRoutes.js
import express from "express";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Admin-only: Get all teams (eventAdmins)
// =======================
router.get(
  "/admin/teams",
  protect,
  authorizeRoles("admin"),
  getTeams
);

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
