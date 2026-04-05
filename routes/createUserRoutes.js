import express from "express";
import {
  registerUser,
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
// (EventAdmin or Sponsor Authoriza): Update User
// =======================
router.put(
  "/update-user/:userId",
  protectUniversal,
  authorizeUniversal({
    allowUserRoles: ["eventAdmin"],
    allowSponsor: true,
  }),
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
