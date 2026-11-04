import express from 'express'

import {
  submitConferenceFeedback,
  getMyConferenceFeedback,
  getConferenceFeedbackResponses,
  getConferenceFeedbackResponseById,
} from '../controllers/appFeedbackResponseController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// =======================
// User: Get My Feedback
// =======================

router.get(
  '/events/:eventId/feedback-by-user',
  protect,
  authorizeRoles('user'),
  getMyConferenceFeedback,
)

// =======================
// User: Submit Feedback
// =======================

router.post(
  '/events/:eventId/feedback',
  protect,
  authorizeRoles('user'),
  submitConferenceFeedback,
)

// =======================
// EventAdmin: Get All Responses
// =======================

router.get(
  '/event-admin/events/:eventId/feedback/responses',
  protect,
  authorizeRoles('eventAdmin'),
  getConferenceFeedbackResponses,
)

// =======================
// EventAdmin: Get Single Response
// =======================

router.get(
  '/event-admin/events/:eventId/feedback/responses/:responseId',
  protect,
  authorizeRoles('eventAdmin'),
  getConferenceFeedbackResponseById,
)

export default router
