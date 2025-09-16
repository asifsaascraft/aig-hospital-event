import express from "express";
import {
  getOrganizers,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
} from "../controllers/organizerController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public: anyone can view organizers
router.get("/organizers", getOrganizers);

// Admin-only: Create, Update, Delete
router.post(
  "/admin/organizers",
  protect,
  authorizeRoles("admin"),
  createOrganizer
);

router.put(
  "/admin/organizers/:id",
  protect,
  authorizeRoles("admin"),
  updateOrganizer
);

router.delete(
  "/admin/organizers/:id",
  protect,
  authorizeRoles("admin"),
  deleteOrganizer
);

export default router;
