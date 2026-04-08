import express from "express";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

import {
  createTravelBySponsor,
  getTravelBySponsor,
  getSponsorTravelQuotaSummary,
  updateTravelBySponsor,
} from "../controllers/sponsorTravelController.js";

const router = express.Router();

// Create
router.post(
  "/sponsor/events/:eventId/travel",
  protectSponsor,
  createTravelBySponsor
);

// Get own
router.get(
  "/sponsor/events/:eventId/travel",
  protectSponsor,
  getTravelBySponsor
);

// Sponsor Travel Quota Summary
router.get(
  "/sponsor/events/:eventId/travel-quota-summary",
  protectSponsor,
  getSponsorTravelQuotaSummary
);

// Update
router.put(
  "/sponsor/travel/:id",
  protectSponsor,
  updateTravelBySponsor
);


export default router;