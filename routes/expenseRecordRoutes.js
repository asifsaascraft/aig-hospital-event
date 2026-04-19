import express from "express";
import {
  createExpenseRecord,
  getExpenseRecordsByEvent,
  updateExpenseRecord,
  deleteExpenseRecord,
} from "../controllers/expenseRecordController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Get All Expenses by Event (Public)
// =======================
router.get(
  "/events/:eventId/expenses",
  getExpenseRecordsByEvent
);

// =======================
// EventAdmin: Create Expense Record
// =======================
router.post(
  "/event-admin/events/:eventId/expenses",
  protect,
  authorizeRoles("eventAdmin"),
  createExpenseRecord
);


// =======================
// EventAdmin: Update Expense Record
// =======================
router.put(
  "/event-admin/expenses/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExpenseRecord
);

// ======================= 
// EventAdmin: Delete Expense Record
// =======================
router.delete(
  "/event-admin/expenses/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExpenseRecord
);

export default router;