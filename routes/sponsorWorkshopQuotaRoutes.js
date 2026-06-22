import express from "express";

import {
  createSponsorWorkshopQuota,
  getSponsorWorkshopQuotasByEvent,
  updateSponsorWorkshopQuota,
  deleteSponsorWorkshopQuota,
} from "../controllers/sponsorWorkshopQuotaController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post(
  "/event-admin/events/:eventId/workshop-quotas",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorWorkshopQuota
);

// GET ALL
router.get(
  "/events/:eventId/workshop-quotas",
  getSponsorWorkshopQuotasByEvent
);

// UPDATE
router.put(
  "/event-admin/workshop-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorWorkshopQuota
);

// DELETE
router.delete(
  "/event-admin/workshop-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorWorkshopQuota
);

export default router;