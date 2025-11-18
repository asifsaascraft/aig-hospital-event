import express from "express";
import {
  createAbstractSetting,
  getAbstractSettingsByEvent,
  updateAbstractSetting,
  deleteAbstractSetting,
} from "../controllers/abstractSettingController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Abstract Setting
// =======================
router.post(
  "/event-admin/events/:eventId/abstract-settings",
  protect,
  authorizeRoles("eventAdmin"),
  createAbstractSetting
);

// =======================
// Public/User: Get All Abstract Settings by Event ID
// =======================
router.get(
  "/events/:eventId/abstract-settings",
  getAbstractSettingsByEvent
);

// =======================
// EventAdmin: Update Abstract Setting
// =======================
router.put(
  "/event-admin/abstract-settings/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAbstractSetting
);

// =======================
// EventAdmin: Delete Abstract Setting
// =======================
router.delete(
  "/event-admin/abstract-settings/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAbstractSetting
);

export default router;
