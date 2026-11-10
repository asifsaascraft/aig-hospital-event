import mongoose from 'mongoose'

const AppNotificationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },

    notificationType: {
      type: String,
      enum: [
        'general_announcement',
        'session',
        'topic',
        'speaker',
        'poll',
        'quiz',
        'live_session',
        'feedback',
      ],
      default: 'general_announcement',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'draft',
        'scheduled',
        'processing',
        'sent',
        'failed',
        'cancelled',
      ],
      default: 'draft',
      required: true,
      index: true,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    // Keeps recovery behavior explicit even after an immediate retry.
    deliveryMode: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate',
      required: true,
      index: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    processingStartedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Sending summary
    totalRecipients: {
      type: Number,
      default: 0,
      min: 0,
    },

    successfulRecipients: {
      type: Number,
      default: 0,
      min: 0,
    },

    failedRecipients: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Scheduler and retry tracking
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Scheduler: find due notifications efficiently.
AppNotificationSchema.index({
  status: 1,
  scheduledAt: 1,
})

// Event notification history.
AppNotificationSchema.index({
  eventId: 1,
  status: 1,
  createdAt: -1,
})

const AppNotification =
  mongoose.models.AppNotification ||
  mongoose.model('AppNotification', AppNotificationSchema)

export default AppNotification