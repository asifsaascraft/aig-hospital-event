import express from "express";
import {
  createIncomeRecord,
  getIncomeRecordsByEvent,
  updateIncomeRecord,
  deleteIncomeRecord,
} from "../controllers/incomeRecordController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Get All Income Records by Event (Public)
// =======================
router.get(
  "/events/:eventId/income",
  getIncomeRecordsByEvent
);

// =======================
// EventAdmin: Create Income Record
// =======================
router.post(
  "/event-admin/events/:eventId/income",
  protect,
  authorizeRoles("eventAdmin"),
  createIncomeRecord
);

// =======================
// EventAdmin: Update Income Record
// =======================
router.put(
  "/event-admin/income/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateIncomeRecord
);

// =======================
// EventAdmin: Delete Income Record
// =======================
router.delete(
  "/event-admin/income/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteIncomeRecord
);

export default router;