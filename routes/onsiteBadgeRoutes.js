import express from "express";

import {
  importRegistrations,
  importAccompanies,
  importSponsorExcel,
  createManualBadge,
  getAllOnsiteBadges,
  updateOnsiteBadge,
  sendBulkBadgeEmails,
  sendSingleBadgeEmail,
  sendSingleOnsiteBadgeWhatsApp,
  sendBulkOnsiteBadgeWhatsApps,
  searchOnsiteBadges,
  printBadge,
  getPublicOnsiteBadgeByToken,
} from "../controllers/onsiteBadgeController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { protectOnsite } from "../middlewares/onsiteAuthMiddleware.js";
import { uploadSponsorExcel } from "../middlewares/uploadMiddleware.js";

const router = express.Router();


// =========================================
// Public Onsite Badge Pass
// =========================================
router.get(
  "/onsite/badges/public/:publicToken",
  getPublicOnsiteBadgeByToken,
);

// =======================
// Event Admin Only
// =======================
router.post(
  "/onsite/import/registrations/:eventId",
  protect,
  authorizeRoles("eventAdmin"),
  importRegistrations,
);

// =======================
// Event Admin Only
// =======================
router.post(
  "/onsite/import/accompanies/:eventId",
  protect,
  authorizeRoles("eventAdmin"),
  importAccompanies,
);

// =======================
// Event Admin Only
// =======================
router.post(
  "/onsite/import/sponsor-excel/:eventId",
  protect,
  authorizeRoles("eventAdmin"),
  uploadSponsorExcel.single("file"),
  importSponsorExcel,
);
// =======================
// Event Admin Only
// =======================
router.post(
  "/event-admin/events/:eventId/onsite/badge-profiles",
  protect,
  authorizeRoles("eventAdmin"),
  createManualBadge,
);

router.post(
  "/event-admin/events/:eventId/onsite/send-badge-emails",
  protect,
  authorizeRoles("eventAdmin"),
  sendBulkBadgeEmails,
);

// =======================
// Event Admin Only
// =======================
router.post(
  "/event-admin/events/:eventId/onsite/send-single-badge-email/:badgeId",
  protect,
  authorizeRoles("eventAdmin"),
  sendSingleBadgeEmail,
);

router.post(
  "/event-admin/events/:eventId/onsite/send-badge-whatsapp",
  protect,
  authorizeRoles("eventAdmin"),
  sendBulkOnsiteBadgeWhatsApps,
);

router.post(
  "/event-admin/events/:eventId/onsite/send-single-badge-whatsapp/:badgeId",
  protect,
  authorizeRoles("eventAdmin"),
  sendSingleOnsiteBadgeWhatsApp,
);

// =======================
// Event Admin Only
// =======================
router.put(
  "/event-admin/events/:eventId/onsite/badges/:badgeId",
  protect,
  authorizeRoles("eventAdmin"),
  updateOnsiteBadge,
);

// =======================
// Get All  (Public))
// =======================
router.get("/event-admin/events/:eventId/onsite/badges", getAllOnsiteBadges);

// =========================================
// SEARCH BADGES (onsite)
// ==========================================
router.get("/onsite/badges/search", protectOnsite, searchOnsiteBadges);

// ==========================================
// PRINT BADGE (onsite)
// ==========================================
router.put("/onsite/badges/print/:id", protectOnsite, printBadge);

export default router;
