import express from "express";
import {
  createIncome,
  getIncomeByEvent,
  updateIncome,
  deleteIncome,
} from "../controllers/incomeController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public - Get by event
router.get("/events/:eventId/income", getIncomeByEvent);

// EventAdmin - Create
router.post(
  "/event-admin/events/:eventId/income",
  protect,
  authorizeRoles("eventAdmin"),
  createIncome
);

// EventAdmin - Update
router.put(
  "/event-admin/income/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateIncome
);

// EventAdmin - Delete
router.delete(
  "/event-admin/income/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteIncome
);

export default router;