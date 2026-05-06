import express from "express";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

import {
  createAccomodation,
  getAccomodationBySponsor,
  updateAccomodation,
  deleteAccomodation,
  getAccomodationSummary,
} from "../controllers/sponsorAccomodationController.js";

const router = express.Router();

// Create
router.post(
  "/sponsor/events/:eventId/accomodation",
  protectSponsor,
  createAccomodation
);

// Get
router.get(
  "/sponsor/events/:eventId/accomodation",
  protectSponsor,
  getAccomodationBySponsor
);

// Summary
router.get(
  "/sponsor/events/:eventId/accomodation-summary",
  protectSponsor,
  getAccomodationSummary
);

// Update
router.put(
  "/sponsor/events/:eventId/accomodation/:id",
  protectSponsor,
  updateAccomodation
);

// Delete
router.delete(
  "/sponsor/accomodation/:id",
  protectSponsor,
  deleteAccomodation
);

export default router;