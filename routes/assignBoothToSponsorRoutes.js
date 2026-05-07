import express from "express";
import {
  assignSponsorsToBooth,
  getAssignedBooths,
  getSponsorsByBooth,
  getMyAssignedBooth,
  removeSponsorFromBooth,
  deleteBoothAssignment,
} from "../controllers/assignBoothToSponsorController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";


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

// Logged-in sponsor can see own booth
router.get(
  "/sponsor/events/:eventId/my-booth",
  protectSponsor,
  getMyAssignedBooth
);

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