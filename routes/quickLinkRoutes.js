import express from "express";

import {
  createQuickLink,
  getQuickLinksByEvent,
  getActiveQuickLinksByEvent,
  getQuickLinkById,
  updateQuickLink,
  deleteQuickLink,
} from "../controllers/quickLinkController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Quick Link
// =======================
router.post(
  "/event-admin/events/:eventId/quick-links",
  protect,
  authorizeRoles("eventAdmin"),
  createQuickLink
);

// =======================
// Public/User: Get All Quick Links
// =======================
router.get(
  "/events/:eventId/quick-links",
  getQuickLinksByEvent
);

// =======================
// Public/User: Get Active Quick Links
// =======================
router.get(
  "/events/:eventId/quick-links/active",
  getActiveQuickLinksByEvent
);

// =======================
// Public/User: Get Quick Link By Id
// =======================
router.get(
  "/quick-links/:id",
  getQuickLinkById
);

// =======================
// EventAdmin: Update Quick Link
// =======================
router.put(
  "/event-admin/quick-links/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateQuickLink
);

// =======================
// EventAdmin: Delete Quick Link
// =======================
router.delete(
  "/event-admin/quick-links/:id",
  protect,
 authorizeRoles("eventAdmin"),
  deleteQuickLink
);

export default router;