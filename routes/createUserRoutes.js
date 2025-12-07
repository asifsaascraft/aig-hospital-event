import express from "express";
import {
  registerUser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/createUserController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// only EventAdmin: Create User (signup)
// =======================
router.post(
  "/event-admin/register",
  protect,
  authorizeRoles("eventAdmin"),
  registerUser
);

// =======================
// only EventAdmin: Get All Users
// =======================
router.get(
  "/event-admin/all-users",
  protect,
  authorizeRoles("eventAdmin"),
  getAllUsers
);

// =======================
// only EventAdmin: Update User
// =======================
router.put(
  "/event-admin/update-user/:userId",
  protect,
  authorizeRoles("eventAdmin"),
  updateUser
);

// =======================
// only EventAdmin: Delete User
// =======================
router.delete(
  "/event-admin/delete-user/:userId",
  protect,
  authorizeRoles("eventAdmin"),
  deleteUser
);


export default router;
