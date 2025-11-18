import express from "express";
import {
  createAgendaSessionType,
  getAgendaSessionTypesByEvent,
  getActiveAgendaSessionTypesByEvent,
  updateAgendaSessionType,
  deleteAgendaSessionType,
} from "../controllers/agendaSessionTypeController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Agenda Session Type
// =======================
router.post(
  "/event-admin/events/:eventId/agenda-session-types",
  protect,
  authorizeRoles("eventAdmin"),
  createAgendaSessionType
);

// =======================
// Public/User: Get All Session Types by Event ID
// =======================
router.get(
  "/events/:eventId/agenda-session-types",
  getAgendaSessionTypesByEvent
);

// =======================
// Public/User: Get Only Active Session Types by Event ID
// =======================
router.get(
  "/events/:eventId/agenda-session-types/active",
  getActiveAgendaSessionTypesByEvent
);

// =======================
// EventAdmin: Update Agenda Session Type
// =======================
router.put(
  "/event-admin/agenda-session-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAgendaSessionType
);

// =======================
// EventAdmin: Delete Agenda Session Type
// =======================
router.delete(
  "/event-admin/agenda-session-types/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAgendaSessionType
);

export default router;
