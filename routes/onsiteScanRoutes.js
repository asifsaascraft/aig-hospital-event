import express from "express";
import {
  scanBadge,
  getScanSummary,
  getScanHistoryByBadge,
  getDetailedScanSummary,
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

// detailed scan summary
router.get(
  "/events/:eventId/scan-summary-details",
  getDetailedScanSummary
);

export default router;