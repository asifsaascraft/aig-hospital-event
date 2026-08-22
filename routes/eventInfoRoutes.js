import express from 'express'

import {
  createEventInfo,
  getEventInfoByEvent,
  getEventInfoById,
  updateEventInfo,
  deleteEventInfo,
} from '../controllers/eventInfoController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

import { uploadMessageImages } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

// =======================
// Get Event Info By Event
// Public
// =======================
router.get('/events/:eventId/event-info', getEventInfoByEvent)

// =======================
// Get Event Info By Id
// =======================
router.get('/event-info/:id', getEventInfoById)

// =======================
// EventAdmin: Create Event Info
// Only one EventInfo allowed per event
// =======================
router.post(
  '/event-admin/events/:eventId/event-info',
  protect,
  authorizeRoles('eventAdmin'),
  uploadMessageImages.single('bannerImage'),
  createEventInfo,
)

// =======================
// EventAdmin: Update Event Info
// =======================
router.put(
  '/event-admin/events/:eventId/event-info',
  protect,
  authorizeRoles('eventAdmin'),
  uploadMessageImages.single('bannerImage'),
  updateEventInfo,
)

// =======================
// EventAdmin: Delete Event Info
// =======================
router.delete(
  '/event-admin/events/:eventId/event-info',
  protect,
  authorizeRoles('eventAdmin'),
  deleteEventInfo,
)

export default router
