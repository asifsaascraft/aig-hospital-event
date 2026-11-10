
import express from 'express'

import {
  createNotification,
  getNotificationsByEvent,
  getNotificationById,
  updateNotification,
  cancelScheduledNotification,
  deleteNotification,
  sendNotificationNow,
  retryNotification,
} from '../controllers/appNotificationController.js'


import {
  protect,
  authorizeRoles,
} from '../middlewares/authMiddleware.js'

const router = express.Router()

// All notification management routes require Event Admin authentication.
router.use(protect, authorizeRoles('eventAdmin'))

// Create notification for an event
router.post(
  '/event-admin/events/:eventId/notifications',
  createNotification
)

// Get all notifications of an event
router.get(
  '/event-admin/events/:eventId/notifications',
  getNotificationsByEvent
)

// Get notification by ID
router.get(
  '/event-admin/notifications/:id',
  getNotificationById
)

// Update draft or scheduled notification
router.put(
  '/event-admin/notifications/:id',
  updateNotification
)

// Cancel scheduled notification
router.patch(
  '/event-admin/notifications/:id/cancel',
  cancelScheduledNotification
)

// Delete draft or failed notification
router.delete(
  '/event-admin/notifications/:id',
  deleteNotification
)

// Send a draft notification immediately
router.post(
  '/event-admin/notifications/:id/send',
  sendNotificationNow
)

// Retry a failed notification
router.post(
  '/event-admin/notifications/:id/retry',
  retryNotification
)

export default router
