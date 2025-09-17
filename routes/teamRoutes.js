import express from "express";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

//  Admin-only: Get all teams
router.get(
  "/admin/teams",
  protect,
  authorizeRoles("admin"),
  getTeams
);

//  Admin-only: Create a new team
router.post(
  "/admin/teams",
  protect,
  authorizeRoles("admin"),
  createTeam
);

//  Admin-only: Update team by ID
router.put(
  "/admin/teams/:id",
  protect,
  authorizeRoles("admin"),
  updateTeam
);

//  Admin-only: Delete team by ID
router.delete(
  "/admin/teams/:id",
  protect,
  authorizeRoles("admin"),
  deleteTeam
);

export default router;
