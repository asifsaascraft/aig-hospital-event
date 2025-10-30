import express from "express";
import {
  createMealPreference,
  getMealPreferencesByEvent,
  getActiveMealPreferencesByEvent,
  updateMealPreference,
  deleteMealPreference,
} from "../controllers/mealPreferenceController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Meal Preference
// =======================
router.post(
  "/event-admin/events/:eventId/meal-preferences",
  protect,
  authorizeRoles("eventAdmin"),
  createMealPreference
);

// =======================
// Public/User: Get All Meal Preferences by Event ID
// =======================
router.get("/events/:eventId/meal-preferences", getMealPreferencesByEvent);

// =======================
// Public/User: Get Only Active Meal Preferences by Event ID
// =======================
router.get("/events/:eventId/meal-preferences/active", getActiveMealPreferencesByEvent);

// =======================
// EventAdmin: Update Meal Preference
// =======================
router.put(
  "/event-admin/meal-preferences/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateMealPreference
);

// =======================
// EventAdmin: Delete Meal Preference
// =======================
router.delete(
  "/event-admin/meal-preferences/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteMealPreference
);

export default router;
