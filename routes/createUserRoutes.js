import express from "express";
import {
  registerUser,
  getAllUsers,
} from "../controllers/createUserController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create User (signup)
// =======================
router.post(
  "/event-admin/register",
  protect,
  authorizeRoles("eventAdmin"),
  registerUser
);

// =======================
// EventAdmin: Get All Users
// =======================
router.get(
  "/event-admin/all-users",
  protect,
  authorizeRoles("eventAdmin"),
  getAllUsers
);


export default router;
