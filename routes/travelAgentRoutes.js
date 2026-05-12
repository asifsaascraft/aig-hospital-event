import express from "express";

import {
  createTravelAgent,
  getAllTravelAgents,
  getActiveTravelAgents,
  updateTravelAgent,
  deleteTravelAgent,
} from "../controllers/travelAgentController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Travel Agent
// =======================
router.post(
  "/event-admin/travel-agents",
  protect,
  authorizeRoles("eventAdmin"),
  createTravelAgent
);

// =======================
// Get All Travel Agents
// =======================
router.get(
  "/travel-agents",
  getAllTravelAgents
);

// =======================
// Get Active Travel Agents
// =======================
router.get(
  "/travel-agents/active",
  getActiveTravelAgents
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