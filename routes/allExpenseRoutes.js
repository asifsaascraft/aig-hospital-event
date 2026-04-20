import express from "express";
import {
  createAllExpense,
  getAllExpensesByEvent,
  updateAllExpense,
  deleteAllExpense,
} from "../controllers/allExpenseController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Get All Expenses by Event (Public)
// =======================
router.get(
  "/events/:eventId/all-expenses",
  getAllExpensesByEvent
);

// =======================
// EventAdmin: Create All Expense
// =======================
router.post(
  "/event-admin/events/:eventId/all-expenses",
  protect,
  authorizeRoles("eventAdmin"),
  createAllExpense
);

// =======================
// EventAdmin: Update All Expense
// =======================
router.put(
  "/event-admin/all-expenses/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAllExpense
);

// =======================
// EventAdmin: Delete All Expense
// =======================
router.delete(
  "/event-admin/all-expenses/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAllExpense
);

export default router;