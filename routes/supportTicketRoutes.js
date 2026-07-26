import express from "express";

import {
  createSupportTicket,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  updateSupportTicketStatus,
} from "../controllers/supportTicketController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadSupportAttachments,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// Public APIs
// =======================

// Create Ticket
router.post(
  "/support-ticket",
  uploadSupportAttachments.array(
    "attachments",
    10
  ),
  createSupportTicket
);

// Get All Tickets
router.get("/support-ticket", getSupportTickets);

// Get Single Ticket
router.get("/support-ticket/:id", getSupportTicketById);

// Update Ticket
router.put(
  "/support-ticket/:id",
  uploadSupportAttachments.array(
    "attachments",
    10
  ),
  updateSupportTicket
);

// Delete Ticket
router.delete("/support-ticket/:id", deleteSupportTicket);

// =======================
// Support Admin Only
// =======================

router.patch(
  "/support-ticket/:id/status",
  protect,
  authorizeRoles("supportAdmin"),
  updateSupportTicketStatus
);

export default router;