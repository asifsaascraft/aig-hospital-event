import express from "express";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { uploadTravelFiles } from "../middlewares/uploadMiddleware.js";

import {
  createTravelBySponsor,
  getTravelBySponsor,
  getMyBookedAssignedTravels,
  getSponsorTravelAgents,
  getSponsorTravelQuotaSummary,
  updateTravelBySponsor,
} from "../controllers/sponsorTravelController.js";

const router = express.Router();

// Create
router.post(
  "/sponsor/events/:eventId/travel",
  protectSponsor,
  uploadTravelFiles.fields([
    { name: "idUpload", maxCount: 1 },
    { name: "travelPlanUpload", maxCount: 1 },
  ]),
  createTravelBySponsor,
);

// Get own
router.get(
  "/sponsor/events/:eventId/travel",
  protectSponsor,
  getTravelBySponsor,
);

// =======================
// Sponsor: Get Only Booked Assigned Travels
// =======================
router.get(
  "/sponsor/events/:eventId/booked-assigned-travel",
  protectSponsor,
  getMyBookedAssignedTravels,
);

// GET USED TRAVEL AGENTS BY SPONSOR
router.get(
  "/sponsor/events/:eventId/travel-agents",
  protectSponsor,
  getSponsorTravelAgents,
);

// Sponsor Travel Quota Summary
router.get(
  "/sponsor/events/:eventId/travel-quota-summary",
  protectSponsor,
  getSponsorTravelQuotaSummary,
);

// Update
router.put(
  "/sponsor/travel/:id",
  protectSponsor,
  uploadTravelFiles.fields([
    { name: "idUpload", maxCount: 1 },
    { name: "travelPlanUpload", maxCount: 1 },
  ]),
  updateTravelBySponsor,
);

export default router;
