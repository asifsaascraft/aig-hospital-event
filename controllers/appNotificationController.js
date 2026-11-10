import mongoose from 'mongoose'
import AppNotificationRecipient from '../models/AppNotificationRecipient.js'
import AppNotification from '../models/AppNotification.js'
import Event from '../models/Event.js'
import {
  claimAndDeliverNotification,
} from '../services/notification/notificationDelivery.service.js'



const NOTIFICATION_TYPES = [
  'general_announcement',
  'session',
  'topic',
  'speaker',
  'poll',
  'quiz',
  'live_session',
  'feedback',
]

const EDITABLE_STATUSES = ['draft', 'scheduled']

// =======================
// Create Notification (EventAdmin Only)
// =======================
export const createNotification = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      title,
      message,
      notificationType = 'general_announcement',
      status = 'draft',
      scheduledAt,
    } = req.body

    // Validate required fields
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notification title and message are required',
      })
    }

    // Validate notification type
    if (!NOTIFICATION_TYPES.includes(notificationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type',
      })
    }

    // Only draft and scheduled notifications can be created directly.
    if (!EDITABLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Notification status must be draft or scheduled',
      })
    }

    // Validate event existence
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Validate scheduled date
    let notificationScheduledAt = null

    if (status === 'scheduled') {
      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date and time are required',
        })
      }

      notificationScheduledAt = new Date(scheduledAt)

      if (
        Number.isNaN(notificationScheduledAt.getTime()) ||
        notificationScheduledAt <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date and time must be in the future',
        })
      }
    }

    // Create Notification
    const notification = await AppNotification.create({
      eventId,
      title: title.trim(),
      message: message.trim(),
      notificationType,
      status,
      scheduledAt: notificationScheduledAt,
      deliveryMode: status === 'scheduled' ? 'scheduled' : 'immediate',
      createdBy: req.user._id,
    })

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    })
  } catch (error) {
    console.error('Create Notification Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Notifications By Event
// =======================
export const getNotificationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const notifications = await AppNotification.find({
      eventId,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
    })
  } catch (error) {
    console.error('Get Notifications By Event Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Notification By ID
// =======================
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const notification = await AppNotification.findById(id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Notification fetched successfully',
      data: notification,
    })
  } catch (error) {
    console.error('Get Notification By ID Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Notification
// Draft and Scheduled Only
// =======================
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params

    const {
      title,
      message,
      notificationType,
      status,
      scheduledAt,
    } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const notification = await AppNotification.findById(id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    // Only draft and scheduled notifications are editable.
    if (!EDITABLE_STATUSES.includes(notification.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft and scheduled notifications can be updated',
      })
    }

    // Validate title
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Notification title cannot be empty',
        })
      }

      notification.title = title.trim()
    }

    // Validate message
    if (message !== undefined) {
      if (!message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Notification message cannot be empty',
        })
      }

      notification.message = message.trim()
    }

    // Validate notification type
    if (notificationType !== undefined) {
      if (!NOTIFICATION_TYPES.includes(notificationType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type',
        })
      }

      notification.notificationType = notificationType
    }

    // Validate status transition
    const nextStatus = status ?? notification.status

    if (!EDITABLE_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Notification can only be draft or scheduled',
      })
    }

    if (nextStatus === 'scheduled') {
      const nextScheduledAt =
        scheduledAt !== undefined
          ? new Date(scheduledAt)
          : notification.scheduledAt

      if (
        !nextScheduledAt ||
        Number.isNaN(nextScheduledAt.getTime()) ||
        nextScheduledAt <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: 'A valid future scheduled date and time are required',
        })
      }

      notification.scheduledAt = nextScheduledAt
    } else {
      notification.scheduledAt = null
    }

    notification.status = nextStatus
    notification.deliveryMode =
      nextStatus === 'scheduled' ? 'scheduled' : 'immediate'

    await notification.save()

    return res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: notification,
    })
  } catch (error) {
    console.error('Update Notification Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Cancel Scheduled Notification
// =======================
export const cancelScheduledNotification = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const notification = await AppNotification.findById(id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    if (notification.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled notifications can be cancelled',
      })
    }

    notification.status = 'cancelled'
    notification.cancelledAt = new Date()

    await notification.save()

    return res.status(200).json({
      success: true,
      message: 'Scheduled notification cancelled successfully',
      data: notification,
    })
  } catch (error) {
    console.error('Cancel Scheduled Notification Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Notification
// Draft and Failed Only
// =======================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const notification = await AppNotification.findById(id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    if (!['draft', 'failed'].includes(notification.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft and failed notifications can be deleted',
      })
    }

    await AppNotificationRecipient.deleteMany({
  notificationId: notification._id,
})

await notification.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Delete Notification Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}




/**
 * Send a draft notification immediately.
 * Delivery continues in the background.
 */
export const sendNotificationNow = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const notification = await claimAndDeliverNotification(id, ['draft'])

    return res.status(202).json({
      success: true,
      message: 'Notification accepted for delivery',
      data: notification,
    })
  } catch (error) {
    console.error('Send notification error:', error)

    return res.status(409).json({
      success: false,
      message: error.message || 'Unable to send notification',
    })
  }
}

/**
 * Retry a failed notification.
 * Delivery continues in the background.
 */
export const retryNotification = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      })
    }

    const existingNotification = await AppNotification.findById(id)

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    // A partially successful notification is already "sent". Retry only
    // when at least one recipient was not accepted by Expo.
    if (
      !['failed', 'sent'].includes(existingNotification.status) ||
      (existingNotification.status === 'sent' &&
        existingNotification.failedRecipients <= 0)
    ) {
      return res.status(409).json({
        success: false,
        message: 'Only failed notifications or sent notifications with failed recipients can be retried',
      })
    }

    const notification = await claimAndDeliverNotification(
      id,
      ['failed', 'sent'],
      'immediate',
    )

    return res.status(202).json({
      success: true,
      message: 'Notification accepted for retry',
      data: notification,
    })
  } catch (error) {
    console.error('Retry notification error:', error)

    return res.status(409).json({
      success: false,
      message: error.message || 'Unable to retry notification',
    })
  }
}
