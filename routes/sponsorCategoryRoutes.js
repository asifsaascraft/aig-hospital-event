import express from "express";
import {
  createSponsorCategory,
  getSponsorCategoriesByEvent,
  updateSponsorCategory,
  deleteSponsorCategory,
} from "../controllers/sponsorCategoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor Category
// =======================
router.post(
  "/event-admin/events/:eventId/sponsor-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorCategory
);

// =======================
// Public/User: Get All Sponsor Categories by Event ID
// =======================
router.get("/events/:eventId/sponsor-categories", getSponsorCategoriesByEvent);

// =======================
// EventAdmin: Update Sponsor Category
// =======================
router.put(
  "/event-admin/sponsor-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorCategory
);

// =======================
// EventAdmin: Delete Sponsor Category
// =======================
router.delete(
  "/event-admin/sponsor-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorCategory
);

export default router;
