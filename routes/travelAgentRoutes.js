import express from "express";
import {
  createTravelAgent,
  getTravelAgentsByEvent,
  getActiveTravelAgentsByEvent,
  updateTravelAgent,
  deleteTravelAgent,
} from "../controllers/travelAgentController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Travel Agent
// =======================
router.post(
  "/event-admin/events/:eventId/travel-agents",
  protect,
  authorizeRoles("eventAdmin"),
  createTravelAgent
);

// =======================
// Public/User: Get All Travel Agents by Event
// =======================
router.get("/events/:eventId/travel-agents", getTravelAgentsByEvent);

// =======================
// Public/User: Get Active Travel Agents
// =======================
router.get(
  "/events/:eventId/travel-agents/active",
  getActiveTravelAgentsByEvent
);

// =======================
// EventAdmin: Update Travel Agent
// =======================
router.put(
  "/event-admin/travel-agents/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateTravelAgent
);

// =======================
// EventAdmin: Delete Travel Agent
// =======================
router.delete(
  "/event-admin/travel-agents/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteTravelAgent
);

export default router;
