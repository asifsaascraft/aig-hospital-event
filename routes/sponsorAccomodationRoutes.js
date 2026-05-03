import express from "express";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { createAccomodation } from "../controllers/sponsorAccomodationController.js";

const router = express.Router();

// =======================
// Create Accommodation
// =======================
router.post(
  "/sponsor/events/:eventId/accomodation",
  protectSponsor,
  createAccomodation
);

export default router;