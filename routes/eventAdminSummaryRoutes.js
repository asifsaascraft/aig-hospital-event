import express from "express";
import {
  getEventRegistrationSummary,
  getAccompanySummary,
  getWorkshopSummary,
  getBanquetSummary,
} from "../controllers/eventAdminSummaryController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


// 1. EventAdmin: Event Registration Paid Summary
router.get(
  "/event-admin/events/:eventId/event-registration/amount", 
  protect,
  authorizeRoles("eventAdmin"),
  getEventRegistrationSummary
);

// 2. EventAdmin: Accompany Paid Summary
router.get(
  "/event-admin/events/:eventId/accompany/amount", 
  protect,
  authorizeRoles("eventAdmin"),
  getAccompanySummary
);

// 3. EventAdmin: Workshop Paid Summary
router.get("/event-admin/events/:eventId/workshop/amount", 
  protect,
  authorizeRoles("eventAdmin"),
  getWorkshopSummary
);

// 4. EventAdmin: Banquet Paid Summary
router.get("/event-admin/events/:eventId/banquet/amount", 
  protect,
  authorizeRoles("eventAdmin"),
  getBanquetSummary
);


export default router;

