import AppNotificationDevice from '../models/AppNotificationDevice.js'

// =======================
// Register / Update App Device
// Public API - No Login Required
// =======================
export const registerNotificationDevice = async (req, res) => {
  try {
    const {
      installationId,
      expoPushToken,
      platform,
      permissionGranted = true,
      deviceName,
      appVersion,
    } = req.body

    // Validate required fields
    if (!installationId || !expoPushToken || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Installation ID, Expo Push Token and Platform are required',
      })
    }

    // Validate platform
    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform must be ios or android',
      })
    }

    // This endpoint registers devices that have granted permission.
    if (permissionGranted !== true) {
      return res.status(400).json({
        success: false,
        message: 'Notification permission must be granted to register a device',
      })
    }

    const now = new Date()

    // Update existing installation or create a new one.
    const device = await AppNotificationDevice.findOneAndUpdate(
      { installationId },
      {
        $set: {
          expoPushToken,
          platform,
          permissionGranted: true,
          isActive: true,
          deviceName: deviceName || null,
          appVersion: appVersion || null,
          lastRegisteredAt: now,
          lastSeenAt: now,
          deactivatedAt: null,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Notification device registered successfully',
      data: device,
    })
  } catch (error) {
    console.error('Register Notification Device Error:', error)

    // Expo token or installation ID already belongs to another record.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This installation or Expo Push Token is already registered',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Deactivate App Device
// Public API - No Login Required
// =======================
export const deactivateNotificationDevice = async (req, res) => {
  try {
    const { installationId } = req.params

    if (!installationId) {
      return res.status(400).json({
        success: false,
        message: 'Installation ID is required',
      })
    }

    const device = await AppNotificationDevice.findOneAndUpdate(
      { installationId },
      {
        $set: {
          isActive: false,
          permissionGranted: false,
          deactivatedAt: new Date(),
        },
      },
      {
        new: true,
      },
    )

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Notification device not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Notification device deactivated successfully',
      data: device,
    })
  } catch (error) {
    console.error('Deactivate Notification Device Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}