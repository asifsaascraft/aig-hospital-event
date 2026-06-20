import express from "express";

import {
  createPrivilege,
  bulkAssignPrivileges,
  getPrivilegesByBadgeProfile,
  getPrivilegeMatrix,
  updatePrivilege,
  deletePrivilege,
} from "../controllers/badgeProfilePrivilegeController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

//================================
// CREATE PRIVILEGE
//================================
router.post(
  "/event-admin/events/:eventId/privileges",
  protect,
  authorizeRoles("eventAdmin"),
  createPrivilege,
);

//=================================
// BULK ASSIGN PRIVILEGES
//=================================
router.post(
  "/event-admin/events/:eventId/privileges/bulk",
  protect,
  authorizeRoles("eventAdmin"),
  bulkAssignPrivileges,
);

//===============================
// GET MATRIX
//===============================
router.get(
  "/event-admin/events/:eventId/privileges",
  protect,
  authorizeRoles("eventAdmin"),
  getPrivilegeMatrix,
);

//======================================================
// GET BY BADGE PROFILE
//======================================================
router.get(
  "/event-admin/events/:eventId/privileges/:badgeProfileId",
  protect,
  authorizeRoles("eventAdmin"),
  getPrivilegesByBadgeProfile,
);

//=============================
// UPDATE
//=============================
router.put(
  "/event-admin/privileges/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updatePrivilege,
);

//=======================
// DELETE
//=======================
router.delete(
  "/event-admin/privileges/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deletePrivilege,
);

export default router;
