import express from 'express'

import {
  createConferenceFeedback,
  getConferenceFeedback,
  updateConferenceFeedback,
  deleteConferenceFeedback,
  getConferenceFeedbackForUser,
} from '../controllers/appFeedbackController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// =======================
// EventAdmin: Create Feedback
// =======================

router.post(
  '/event-admin/events/:eventId/feedback',
  protect,
  authorizeRoles('eventAdmin'),
  createConferenceFeedback,
)

// =======================
// EventAdmin: Get Feedback
// =======================

router.get(
  '/event-admin/events/:eventId/feedback',
  protect,
  authorizeRoles('eventAdmin'),
  getConferenceFeedback,
)


// =======================
// User: Get Published Feedback
// =======================

router.get(
  '/events/:eventId/feedback',
  protect,
  authorizeRoles('user'),
  getConferenceFeedbackForUser,
)

// =======================
// EventAdmin: Update Feedback
// =======================

router.put(
  '/event-admin/events/:eventId/feedback',
  protect,
  authorizeRoles('eventAdmin'),
  updateConferenceFeedback,
)

// =======================
// EventAdmin: Delete Feedback
// =======================

router.delete(
  '/event-admin/events/:eventId/feedback',
  protect,
  authorizeRoles('eventAdmin'),
  deleteConferenceFeedback,
)

export default router
