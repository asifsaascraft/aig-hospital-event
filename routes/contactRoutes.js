import express from "express";

import {
  createContact,
  getContactsByEvent,
  getContactById,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Contact
// =======================
router.post(
  "/event-admin/events/:eventId/contacts",
  protect,
  authorizeRoles("eventAdmin"),
  createContact
);

// =======================
// Public/User: Get All Contacts
// =======================
router.get(
  "/events/:eventId/contacts",
  getContactsByEvent
);

// =======================
// Public/User: Get Contact By Id
// =======================
router.get(
  "/contacts/:id",
  getContactById
);

// =======================
// EventAdmin: Update Contact
// =======================
router.put(
  "/event-admin/contacts/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateContact
);

// =======================
// EventAdmin: Delete Contact
// =======================
router.delete(
  "/event-admin/contacts/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteContact
);

export default router;