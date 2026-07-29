import express from 'express'

import {
  createSupportTicket,
  getSupportTickets,
  getMySupportTickets,
  getSupportTicketById,
  replySupportTicket,
  assignSupportTicket,
  updateSupportTicketStatus,
  reopenSupportTicket,
  addInternalNote,
  submitTicketFeedback,
} from '../controllers/supportTicketController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

import { uploadSupportAttachments } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

/* ============================================================
    EVENT ADMIN
============================================================ */

// Create Support Ticket
router.post(
  '/support-ticket',
  protect,
  authorizeRoles('eventAdmin'),
  uploadSupportAttachments.array('attachments', 10),
  createSupportTicket,
)

// My Tickets
router.get(
  '/support-ticket/my',
  protect,
  authorizeRoles('eventAdmin'),
  getMySupportTickets,
)

// Get Ticket Details
router.get(
  '/support-ticket/:id',
  protect,
  authorizeRoles('eventAdmin', 'supportAdmin'),
  getSupportTicketById,
)

// Reply Ticket
router.post(
  '/support-ticket/:id/reply',
  protect,
  authorizeRoles('eventAdmin', 'supportAdmin'),
  uploadSupportAttachments.array('attachments', 10),
  replySupportTicket,
)

// Reopen Ticket
router.patch(
  '/support-ticket/:id/reopen',
  protect,
  authorizeRoles('eventAdmin'),
  reopenSupportTicket,
)

// Submit Feedback
router.post(
  '/support-ticket/:id/feedback',
  protect,
  authorizeRoles('eventAdmin'),
  submitTicketFeedback,
)

/* ============================================================
    SUPPORT ADMIN
============================================================ */

// Get All Tickets
router.get(
  '/support-ticket',
  protect,
  authorizeRoles('supportAdmin'),
  getSupportTickets,
)

// Assign Ticket
router.patch(
  '/support-ticket/:id/assign',
  protect,
  authorizeRoles('supportAdmin'),
  assignSupportTicket,
)

// Update Status
router.patch(
  '/support-ticket/:id/status',
  protect,
  authorizeRoles('supportAdmin'),
  updateSupportTicketStatus,
)

// Add Internal Note
router.post(
  '/support-ticket/:id/internal-note',
  protect,
  authorizeRoles('supportAdmin'),
  uploadSupportAttachments.array('attachments', 10),
  addInternalNote,
)

export default router
