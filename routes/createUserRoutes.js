import express from "express";
import {
  registerUserByEventAdmin,
  getAllUsers,
  getAllUsersCreatedByEventAdmin,
  getAllUsersCreatedBySponsor,
  updateUser,
  deleteUser,
  checkUserEmailExists,
  registerUserBySponsor,
} from "../controllers/createUserController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// (EventAdmin Authorize): Create User (signup)
// =======================
router.post(
  "/create-user",
  protect,
  authorizeRoles("eventAdmin"),
  registerUserByEventAdmin,
);

// =======================
// (Sponsor Authorize): Create User (signup)
// =======================
router.post(
  "/sponsor/create-user",
  protectSponsor,
  registerUserBySponsor,
);

// =======================
// Admin: Get All Users
// =======================
router.get(
  "/admin/users",
  protect,
  authorizeRoles("admin"),
  getAllUsers
);

// =======================
// EventAdmin: Get ONLY EventAdmin Created Users
// =======================
router.get(
  "/event-admin/users",
  protect,
  authorizeRoles("eventAdmin"),
  getAllUsersCreatedByEventAdmin,
);

// =======================
// Sponsor: Get ONLY Sponsor Created Users
// =======================
router.get(
  "/sponsor/users",
  protectSponsor,
  getAllUsersCreatedBySponsor,
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

// =======================
// (EventAdmin Authorize): Check Email Exists (Role: user)
// =======================
router.post(
  "/check-user-email",
  protect,
  authorizeRoles("eventAdmin"),
  checkUserEmailExists
);


export default router;
