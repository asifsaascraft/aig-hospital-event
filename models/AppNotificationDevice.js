import mongoose from 'mongoose'

const AppNotificationDeviceSchema = new mongoose.Schema(
  {
    // Stable UUID generated and maintained by the mobile app.
    installationId: {
      type: String,
      required: true,
      trim: true,
    },

    expoPushToken: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: ['ios', 'android'],
      required: true,
    },

    // Optional because the app is publicly accessible.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    permissionGranted: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    deviceName: {
      type: String,
      default: null,
      trim: true,
    },

    appVersion: {
      type: String,
      default: null,
      trim: true,
    },

    lastRegisteredAt: {
      type: Date,
      default: Date.now,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// One record per app installation.
AppNotificationDeviceSchema.index(
  { installationId: 1 },
  { unique: true },
)

// An Expo Push Token should belong to only one installation.
AppNotificationDeviceSchema.index(
  { expoPushToken: 1 },
  { unique: true },
)

// Find eligible devices when sending notifications.
AppNotificationDeviceSchema.index({
  isActive: 1,
  permissionGranted: 1,
})

const AppNotificationDevice =
  mongoose.models.AppNotificationDevice ||
  mongoose.model('AppNotificationDevice', AppNotificationDeviceSchema)

export default AppNotificationDevice