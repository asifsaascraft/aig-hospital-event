import express from "express";
import {
  scanBadge,
  getScanSummary,
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

export default router;