import express from "express";
import {
  getExpenseCategories,
  getActiveExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expenseCategoryController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Public routes
// =======================
router.get("/expense-categories", getExpenseCategories);

router.get("/expense-categories/active", getActiveExpenseCategories);

// =======================
// Event Admin routes
// =======================
router.post(
  "/event-admin/expense-categories",
  protect,
  authorizeRoles("eventAdmin"),
  createExpenseCategory
);

router.put(
  "/event-admin/expense-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateExpenseCategory
);

router.delete(
  "/event-admin/expense-categories/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExpenseCategory
);

export default router;