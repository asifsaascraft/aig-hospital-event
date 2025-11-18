import express from "express";
import {
  createAgendaSessionHall,
  getAgendaSessionHallsByEvent,
  getActiveAgendaSessionHallsByEvent,
  updateAgendaSessionHall,
  deleteAgendaSessionHall,
} from "../controllers/agendaSessionHallController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Hall
// =======================
router.post(
  "/event-admin/events/:eventId/agenda-session-halls",
  protect,
  authorizeRoles("eventAdmin"),
  createAgendaSessionHall
);

// =======================
// Public/User: Get All Halls by Event ID
// =======================
router.get(
  "/events/:eventId/agenda-session-halls",
  getAgendaSessionHallsByEvent
);

// =======================
// Public/User: Get Only Active Halls by Event ID
// =======================
router.get(
  "/events/:eventId/agenda-session-halls/active",
  getActiveAgendaSessionHallsByEvent
);

// =======================
// EventAdmin: Update Hall
// =======================
router.put(
  "/event-admin/agenda-session-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAgendaSessionHall
);

// =======================
// EventAdmin: Delete Hall
// =======================
router.delete(
  "/event-admin/agenda-session-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAgendaSessionHall
);

export default router;
