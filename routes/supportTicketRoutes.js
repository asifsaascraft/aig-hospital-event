import express from 'express'

import {
  createSupportTicket,
  getSupportTickets,
  getMySupportTickets,
  getAssignedToMeTickets,
  getTicketStats,
  getSupportAdminList,
  getSupportTicketById,
  getTicketTimeline,
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

// Tickets Assigned To Me -- NEW
// NOTE: must stay above /support-ticket/:id so "assigned-to-me"
// isn't swallowed as an :id param.
router.get(
  '/support-ticket/assigned-to-me',
  protect,
  authorizeRoles('supportAdmin'),
  getAssignedToMeTickets,
)

// Ticket Stats -- NEW
router.get(
  '/support-ticket/stats',
  protect,
  authorizeRoles('supportAdmin'),
  getTicketStats,
)

// Active Support Admin List (for assignment dropdown) -- NEW
router.get(
  '/support-ticket/support-admins',
  protect,
  authorizeRoles('supportAdmin'),
  getSupportAdminList,
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

/* ============================================================
    SHARED (Event Admin + Support Admin)
============================================================ */

// Get Ticket Details
// NOTE: kept below all static /support-ticket/* routes above
// so it doesn't intercept them as an :id param.
router.get(
  '/support-ticket/:id',
  protect,
  authorizeRoles('eventAdmin', 'supportAdmin'),
  getSupportTicketById,
)

// Get Ticket Timeline -- NEW
router.get(
  '/support-ticket/:id/timeline',
  protect,
  authorizeRoles('eventAdmin', 'supportAdmin'),
  getTicketTimeline,
)

// Reply Ticket
router.post(
  '/support-ticket/:id/reply',
  protect,
  authorizeRoles('eventAdmin', 'supportAdmin'),
  uploadSupportAttachments.array('attachments', 10),
  replySupportTicket,
)

export default router
