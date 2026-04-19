import express from "express";
import {
  getExpenseHeads,
  getActiveExpenseHeads,
  createExpenseHead,
  updateExpenseHead,
  deleteExpenseHead,
} from "../controllers/expenseHeadController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Public routes
// =======================
router.get("/expense-heads", getExpenseHeads);

router.get("/expense-heads/active", getActiveExpenseHeads);

// =======================
// Event Admin routes
// =======================
router.post(
  "/event-admin/expense-heads",
  protect,
  authorizeRoles("eventAdmin"),
  createExpenseHead
);

router.put(
  "/event-admin/expense-heads/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExpenseHead
);

router.delete(
  "/event-admin/expense-heads/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExpenseHead
);

export default router;