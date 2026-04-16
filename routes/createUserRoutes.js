import express from "express";
import {
  registerUser,
  getAllUsers,
  getAllUsersCreatedByEventAdmin,
  getAllUsersCreatedBySponsor,
  updateUser,
  deleteUser,
  checkUserEmailExists,
} from "../controllers/createUserController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { protectUniversal } from "../middlewares/protectUniversal.js";
import { authorizeUniversal } from "../middlewares/authorizeUniversal.js";

const router = express.Router();

// =======================
// (EventAdmin or Sponsor Authoriza): Create User (signup)
// =======================
router.post(
  "/create-user",
  protectUniversal,
  authorizeUniversal({
    allowUserRoles: ["eventAdmin"],
    allowSponsor: true,
  }),
  registerUser,
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
// (EventAdmin or Sponsor Authoriza): Check Email Exists (Role: user)
// =======================
router.post(
  "/check-user-email",
  protectUniversal,
  authorizeUniversal({
    allowUserRoles: ["eventAdmin"],
    allowSponsor: true,
  }),
  checkUserEmailExists
);


export default router;
