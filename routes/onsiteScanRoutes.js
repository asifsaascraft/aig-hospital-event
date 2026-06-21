import express from "express";
import {
  scanBadge,
  getScanSummary,
  getScanHistoryByBadge,
} from "../controllers/onsiteScanController.js";
import { protectOnsite } from "../middlewares/onsiteAuthMiddleware.js";

const router = express.Router();

// badge scan
router.post(
  "/onsite/scan",
  protectOnsite,
  scanBadge
);

// scan summary
router.get(
  "/events/:eventId/scan-summary",getScanSummary
);

// get api by ID
router.get(
  "/onsite/scan-history/:badgeId",
  protectOnsite,
  getScanHistoryByBadge
);

export default router;