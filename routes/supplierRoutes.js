// routes/supplierRoutes.js
import express from "express";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Logged-in users can view suppliers
router.get("/suppliers", protect, getSuppliers);
router.get("/suppliers/:id", protect, getSupplierById);

// Admin-only: Create, Update, Delete
router.post(
  "/admin/suppliers",
  protect,
  authorizeRoles("admin"),
  createSupplier
);

router.put(
  "/admin/suppliers/:id",
  protect,
  authorizeRoles("admin"),
  updateSupplier
);

router.delete(
  "/admin/suppliers/:id",
  protect,
  authorizeRoles("admin"),
  deleteSupplier
);

export default router;
