import mongoose from 'mongoose'

const AppNotificationRecipientSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppNotification',
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppNotificationDevice',
      required: true,
    },

    // Expo push ticket tracking.
    pushTicketId: {
      type: String,
      default: null,
    },

    ticketStatus: {
      type: String,
      enum: ['pending', 'ok', 'error', 'expired'],
      default: 'pending',
    },

    // Expo push receipt tracking.
    receiptStatus: {
      type: String,
      enum: ['pending', 'ok', 'error', 'expired'],
      default: 'pending',
    },

    pushError: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    // In-app notification read tracking.
    readAt: {
      type: Date,
      default: null,
    },

    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Prevent duplicate recipient records for the same device.
AppNotificationRecipientSchema.index(
  {
    notificationId: 1,
    deviceId: 1,
  },
  {
    unique: true,
  },
)

// Fetch a particular device's notification history for an event.
AppNotificationRecipientSchema.index({
  deviceId: 1,
  eventId: 1,
  createdAt: -1,
})

// Fetch unread notifications for a device.
AppNotificationRecipientSchema.index({
  deviceId: 1,
  readAt: 1,
})

const AppNotificationRecipient =
  mongoose.models.AppNotificationRecipient ||
  mongoose.model(
    'AppNotificationRecipient',
    AppNotificationRecipientSchema,
  )

export default AppNotificationRecipient