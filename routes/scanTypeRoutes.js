import express from "express";

import {
  createScanType,
  getScanTypes,
  getActiveScanTypes,
  getSingleScanType,
  updateScanType,
  deleteScanType,
} from "../controllers/scanTypeController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================
// Create Scan Type
// ======================================
router.post(
  "/event-admin/events/:eventId/scan-types",
  protect,
  authorizeRoles("eventAdmin"),
  createScanType
);

// ======================================
// Get All Scan Types
// ======================================
router.get(
  "/events/:eventId/scan-types",
  getScanTypes
);

// ======================================
// Get Active Scan Types
// ======================================
router.get(
  "/events/:eventId/scan-types/active",
  getActiveScanTypes
);

// ======================================
// Get Single Scan Type
// ======================================
router.get(
  "/scan-types/:id",
  getSingleScanType
);

// ======================================
// Update Scan Type
// ======================================
router.put(
  "/event-admin/scan-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateScanType
);

// ======================================
// Delete Scan Type
// ======================================
router.delete(
  "/event-admin/scan-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteScanType
);

export default router;