
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
//router.use(protect, authorizeRoles('eventAdmin'))

// Create notification for an event
router.post(
  '/event-admin/events/:eventId/notifications',
  protect,
  authorizeRoles('eventAdmin'),
  createNotification,
)

// Get all notifications of an event
router.get(
  '/event-admin/events/:eventId/notifications',
  protect,
  authorizeRoles('eventAdmin'),
  getNotificationsByEvent
)

// Get notification by ID
router.get(
  '/event-admin/notifications/:id',
  protect,
  authorizeRoles('eventAdmin'),
  getNotificationById
)

// Update draft or scheduled notification
router.put(
  '/event-admin/notifications/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateNotification
)

// Cancel scheduled notification
router.patch(
  '/event-admin/notifications/:id/cancel',
  protect,
  authorizeRoles('eventAdmin'),
  cancelScheduledNotification
)

// Delete draft or failed notification
router.delete(
  '/event-admin/notifications/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteNotification
)

// Send a draft notification immediately
router.post(
  '/event-admin/notifications/:id/send',
  protect,
  authorizeRoles('eventAdmin'),
  sendNotificationNow
)

// Retry a failed notification
router.post(
  '/event-admin/notifications/:id/retry',
  protect,
  authorizeRoles('eventAdmin'),
  retryNotification
)

export default router
