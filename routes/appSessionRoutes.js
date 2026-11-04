import express from 'express'

import {
  createLiveSession,
  getLiveSessionsByEvent,
  getActiveLiveSessionsByEvent,
  updateLiveSession,
  deleteLiveSession,
} from '../controllers/appSessionController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

/*
========================================================
  Event Admin - Live Sessions
========================================================
*/

// Create live session
router.post(
  '/event-admin/events/:eventId/live-sessions',
  protect,
  authorizeRoles('eventAdmin'),
  createLiveSession,
)

// Get all live sessions for event
router.get(
  '/event-admin/events/:eventId/live-sessions',
  protect,
  authorizeRoles('eventAdmin'),
  getLiveSessionsByEvent,
)

// Update live session
router.put(
  '/event-admin/live-sessions/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateLiveSession,
)

// Delete live session
router.delete(
  '/event-admin/live-sessions/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteLiveSession,
)

/*
========================================================
  User - Active Live Sessions
========================================================
*/

router.get(
  '/events/:eventId/live-sessions/active',
  getActiveLiveSessionsByEvent,
)

export default router
