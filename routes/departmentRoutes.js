import express from "express";
import {
  getDepartments,
  getActiveDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

//  Public: anyone can view departments
router.get("/departments", getDepartments);

// Public: only ACTIVE departments
router.get("/departments/active", getActiveDepartments);

//  Admin-only: Create, Update, Delete
router.post(
  "/admin/departments",
  protect,
  authorizeRoles("admin"),
  createDepartment
);

router.put(
  "/admin/departments/:id",
  protect,
  authorizeRoles("admin"),
  updateDepartment
);

router.delete(
  "/admin/departments/:id",
  protect,
  authorizeRoles("admin"),
  deleteDepartment
);

export default router;
