import express from "express";

import {
  getSponsorQuotaStatus,
} from "../controllers/sponsorQuotaController.js";

import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

const router = express.Router();

// Get logged-in sponsor quota status
router.get(
  "/sponsor/quota/event/:eventId",
  protectSponsor,
  getSponsorQuotaStatus
);

export default router;