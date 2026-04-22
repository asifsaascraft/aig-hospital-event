import express from "express";
import {
  assignSponsorsToBooth,
  getAssignedBooths,
  getSponsorsByBooth,
  removeSponsorFromBooth,
  deleteBoothAssignment,
} from "../controllers/assignBoothToSponsorController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Assign sponsors to booth
router.post(
  "/event-admin/events/:eventId/assign-booth",
  protect,
  authorizeRoles("eventAdmin"),
  assignSponsorsToBooth
);

// Get all booth assignments
router.get("/events/:eventId/assign-booth", getAssignedBooths);

// Get single booth
router.get("/assign-booth/:sponsorBoothId", getSponsorsByBooth);

// Remove sponsor from booth
router.delete(
  "/assign-booth/:sponsorBoothId/:sponsorId",
  protect,
  authorizeRoles("eventAdmin"),
  removeSponsorFromBooth
);

// Delete full assignment
router.delete(
  "/assign-booth/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteBoothAssignment
);

export default router;