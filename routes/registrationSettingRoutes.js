import express from "express";
import {
  createRegistrationSetting,
  getRegistrationSettingsByEvent,
  updateRegistrationSetting,
  deleteRegistrationSetting,
} from "../controllers/registrationSettingController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Registration Setting
// =======================
router.post(
  "/event-admin/events/:eventId/registration-settings",
  protect,
  authorizeRoles("eventAdmin"),
  createRegistrationSetting
);

// =======================
// Public/User: Get All Registration Settings by Event ID
// =======================
router.get("/events/:eventId/registration-settings", getRegistrationSettingsByEvent);

// =======================
// EventAdmin: Update Registration Setting
// =======================
router.put(
  "/event-admin/registration-settings/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationSetting
);

// =======================
// EventAdmin: Delete Registration Setting
// =======================
router.delete(
  "/event-admin/registration-settings/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteRegistrationSetting
);

export default router;
