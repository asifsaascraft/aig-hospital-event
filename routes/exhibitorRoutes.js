import express from "express";

import {
  createExhibitor,
  getExhibitorsByEvent,
  getActiveExhibitorsByEvent,
  getExhibitorById,
  updateExhibitor,
  deleteExhibitor,
} from "../controllers/exhibitorController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadExhibitorImage,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Exhibitor
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitors",
  protect,
  authorizeRoles("eventAdmin"),
  uploadExhibitorImage.single("image"),
  createExhibitor
);

// =======================
// Public/User: Get All Exhibitors
// =======================
router.get(
  "/events/:eventId/exhibitors",
  getExhibitorsByEvent
);

// =======================
// Public/User: Get Active Exhibitors
// =======================
router.get(
  "/events/:eventId/exhibitors/active",
  getActiveExhibitorsByEvent
);

// =======================
// Public/User: Get Exhibitor By Id
// =======================
router.get(
  "/exhibitors/:id",
  getExhibitorById
);

// =======================
// EventAdmin: Update Exhibitor
// =======================
router.put(
  "/event-admin/exhibitors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadExhibitorImage.single("image"),
  updateExhibitor
);

// =======================
// EventAdmin: Delete Exhibitor
// =======================
router.delete(
  "/event-admin/exhibitors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitor
);

export default router;