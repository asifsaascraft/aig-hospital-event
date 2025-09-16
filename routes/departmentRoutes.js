import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

//  Public: anyone can view departments
router.get("/departments", getDepartments);

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
