
import express from 'express'

import {
  registerNotificationDevice,
  deactivateNotificationDevice,
} from '../controllers/appNotificationDeviceController.js'

const router = express.Router()

// Register or update an app installation's push notification token
router.post(
  '/app/notification-devices/register',
  registerNotificationDevice
)

// Deactivate an app installation
router.patch(
  '/app/notification-devices/:installationId/deactivate',
  deactivateNotificationDevice
)

export default router
