import mongoose from 'mongoose'

import AppNotification from '../../models/AppNotification.js'
import AppNotificationDevice from '../../models/AppNotificationDevice.js'
import AppNotificationRecipient from '../../models/AppNotificationRecipient.js'
import {
  getExpoPushReceipts,
  sendExpoPushNotifications,
} from './expoPush.service.js'

const DELIVERY_BATCH_SIZE = 100
const RECEIPT_MIN_AGE_MS = 15 * 60 * 1000
const RECEIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000

const buildPushMessage = (notification, device) => ({
  to: device.expoPushToken,
  sound: 'default',
  title: notification.title,
  body: notification.message,
  priority: 'high',
  // Preserve the existing Android channel used by local reminders.
  channelId: 'event-reminders',
  data: {
    notificationId: notification._id.toString(),
    eventId: notification.eventId.toString(),
    notificationType: notification.notificationType,
  },
})

/**
 * Sends one batch. Successful Expo tickets are persisted and never
 * resent by a normal retry; only pending/error recipient records retry.
 */
const deliverBatch = async (notification, devices) => {
  const attemptedAt = new Date()

  try {
    const tickets = await sendExpoPushNotifications(
      devices.map((device) => buildPushMessage(notification, device)),
    )

    const operations = devices.map((device, index) => {
      const ticket = tickets[index]
      const accepted = ticket?.status === 'ok'

      return {
        updateOne: {
          filter: {
            notificationId: notification._id,
            deviceId: device._id,
          },
          update: {
            $set: {
              pushTicketId: accepted ? ticket.id || null : null,
              ticketStatus: accepted ? 'ok' : 'error',
              receiptStatus: accepted ? 'pending' : 'error',
              pushError: accepted
                ? null
                : ticket?.message || 'Missing or rejected Expo push ticket',
              sentAt: accepted ? attemptedAt : null,
              lastAttemptAt: attemptedAt,
            },
            $inc: { attemptCount: 1 },
          },
        },
      }
    })

    if (operations.length) {
      await AppNotificationRecipient.bulkWrite(operations, { ordered: false })
    }

    return tickets.filter((ticket) => ticket?.status === 'ok').length
  } catch (error) {
    console.error('Expo push batch delivery error:', error)

    await AppNotificationRecipient.updateMany(
      {
        notificationId: notification._id,
        deviceId: { $in: devices.map((device) => device._id) },
        ticketStatus: { $ne: 'ok' },
      },
      {
        $set: {
          ticketStatus: 'error',
          receiptStatus: 'error',
          pushTicketId: null,
          pushError: error.message || 'Expo push request failed',
          lastAttemptAt: attemptedAt,
        },
        $inc: { attemptCount: 1 },
      },
    )

    return 0
  }
}

/**
 * Processes a notification already atomically claimed as "processing".
 * Recipient records are created once. Existing successful recipients are
 * preserved on retry, preventing routine duplicate pushes.
 */
export const processClaimedNotification = async (notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new Error('Invalid notification ID')
  }

  const notification = await AppNotification.findOne({
    _id: notificationId,
    status: 'processing',
  })

  if (!notification) {
    throw new Error('Processing notification not found')
  }

  try {
    let recipientRecords = await AppNotificationRecipient.find({
      notificationId: notification._id,
    }).select('deviceId ticketStatus')

    // Snapshot eligible installations only on the first delivery attempt.
    // Later retries do not unexpectedly send the old notification to new installs.
    if (recipientRecords.length === 0) {
      const devices = await AppNotificationDevice.find({
        isActive: true,
        permissionGranted: true,
      }).select('_id')

      if (devices.length > 0) {
        await AppNotificationRecipient.bulkWrite(
          devices.map((device) => ({
            updateOne: {
              filter: {
                notificationId: notification._id,
                deviceId: device._id,
              },
              update: {
                $setOnInsert: {
                  notificationId: notification._id,
                  eventId: notification.eventId,
                  deviceId: device._id,
                  ticketStatus: 'pending',
                  receiptStatus: 'pending',
                  attemptCount: 0,
                },
              },
              upsert: true,
            },
          })),
          { ordered: false },
        )
      }

      recipientRecords = await AppNotificationRecipient.find({
        notificationId: notification._id,
      }).select('deviceId ticketStatus')
    }

    if (recipientRecords.length === 0) {
      notification.status = 'failed'
      notification.totalRecipients = 0
      notification.successfulRecipients = 0
      notification.failedRecipients = 0
      notification.failureReason = 'No eligible notification devices found'
      notification.processingStartedAt = null
      notification.lastAttemptAt = new Date()
      await notification.save()
      return notification
    }

    const activeDevices = await AppNotificationDevice.find({
      _id: { $in: recipientRecords.map((item) => item.deviceId) },
      isActive: true,
      permissionGranted: true,
    }).select('_id expoPushToken platform')

    const activeDeviceIds = new Set(activeDevices.map((item) => item._id.toString()))
    const retryableIds = new Set(
      recipientRecords
        .filter((item) => item.ticketStatus !== 'ok' && activeDeviceIds.has(item.deviceId.toString()))
        .map((item) => item.deviceId.toString()),
    )

    const retryableDevices = activeDevices.filter((device) =>
      retryableIds.has(device._id.toString()),
    )

    // Refresh the processing timestamp as a heartbeat before each batch.
    for (let i = 0; i < retryableDevices.length; i += DELIVERY_BATCH_SIZE) {
      await AppNotification.updateOne(
        { _id: notification._id, status: 'processing' },
        { $set: { processingStartedAt: new Date() } },
      )

      await deliverBatch(
        notification,
        retryableDevices.slice(i, i + DELIVERY_BATCH_SIZE),
      )
    }

    const finalRecipients = await AppNotificationRecipient.find({
      notificationId: notification._id,
    }).select('ticketStatus')

    const successfulRecipients = finalRecipients.filter(
      (item) => item.ticketStatus === 'ok',
    ).length
    const failedRecipients = finalRecipients.length - successfulRecipients

    notification.status = successfulRecipients > 0 ? 'sent' : 'failed'
    notification.sentAt = successfulRecipients > 0
      ? notification.sentAt || new Date()
      : null
    notification.totalRecipients = finalRecipients.length
    notification.successfulRecipients = successfulRecipients
    notification.failedRecipients = failedRecipients
    notification.lastAttemptAt = new Date()
    notification.processingStartedAt = null
    notification.failureReason = failedRecipients > 0
      ? `${failedRecipients} recipient(s) were not accepted by Expo`
      : null

    await notification.save()
    return notification
  } catch (error) {
    console.error('Notification delivery error:', error)

    await AppNotification.updateOne(
      { _id: notification._id, status: 'processing' },
      {
        $set: {
          status: 'failed',
          processingStartedAt: null,
          failureReason: error.message || 'Notification delivery failed',
          lastAttemptAt: new Date(),
        },
      },
    )

    throw error
  }
}

/**
 * Atomically claims a draft or retryable notification and starts delivery.
 * A successful recipient is never reset; retries only process unresolved rows.
 */
export const claimAndDeliverNotification = async (
  notificationId,
  allowedStatuses = ['draft'],
  deliveryMode = 'immediate',
) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new Error('Invalid notification ID')
  }

  const notification = await AppNotification.findOneAndUpdate(
    {
      _id: notificationId,
      status: { $in: allowedStatuses },
    },
    {
      $set: {
        status: 'processing',
        deliveryMode,
        processingStartedAt: new Date(),
        failureReason: null,
      },
      $inc: { attemptCount: 1 },
    },
    { new: true },
  )

  if (!notification) {
    throw new Error(
      'Notification cannot be sent. It may already be processing or its status does not allow delivery.',
    )
  }

  // Background delivery is intentional; stale-processing recovery handles restarts.
  processClaimedNotification(notification._id).catch((error) => {
    console.error(
      `Background notification delivery failed (${notification._id}):`,
      error,
    )
  })

  return notification
}

/**
 * Reconciles Expo receipts. Ticket acceptance is not equivalent to device
 * display; receipts are tracked separately and invalid tokens are deactivated.
 */
export const reconcileExpoPushReceipts = async () => {
  const now = Date.now()
  const expiryCutoff = new Date(now - RECEIPT_MAX_AGE_MS)
  const eligibleCutoff = new Date(now - RECEIPT_MIN_AGE_MS)

  // Close out receipts that Expo did not make available within 24 hours.
  const expiredResult = await AppNotificationRecipient.updateMany(
    {
      ticketStatus: 'ok',
      receiptStatus: 'pending',
      pushTicketId: { $ne: null },
      sentAt: { $lt: expiryCutoff },
    },
    {
      $set: {
        receiptStatus: 'expired',
        pushError: 'Expo receipt was not available within 24 hours',
      },
    },
  )

  const expired = expiredResult.modifiedCount || 0

  const recipients = await AppNotificationRecipient.find({
    ticketStatus: 'ok',
    receiptStatus: 'pending',
    pushTicketId: { $ne: null },
    sentAt: {
      $lte: eligibleCutoff,
      $gte: expiryCutoff,
    },
  })
    .select('_id deviceId pushTicketId')
    .limit(1000)
    .lean()

  if (recipients.length === 0) {
    return { checked: 0, successful: 0, failed: 0, expired }
  }

  const receipts = await getExpoPushReceipts(
    recipients.map((recipient) => recipient.pushTicketId),
  )

  let successful = 0
  let failed = 0

  for (const recipient of recipients) {
    const receipt = receipts[recipient.pushTicketId]
    if (!receipt) continue

    if (receipt.status === 'ok') {
      const result = await AppNotificationRecipient.updateOne(
        { _id: recipient._id, receiptStatus: 'pending' },
        { $set: { receiptStatus: 'ok', pushError: null } },
      )
      if (result.modifiedCount) successful += 1
      continue
    }

    if (receipt.status === 'error') {
      const errorCode = receipt.details?.error || null
      const errorMessage =
        receipt.message || errorCode || 'Expo receipt reported an error'

      const result = await AppNotificationRecipient.updateOne(
        { _id: recipient._id, receiptStatus: 'pending' },
        { $set: { receiptStatus: 'error', pushError: errorMessage } },
      )
      if (result.modifiedCount) failed += 1

      if (errorCode === 'DeviceNotRegistered') {
        await AppNotificationDevice.updateOne(
          { _id: recipient.deviceId },
          {
            $set: {
              isActive: false,
              permissionGranted: false,
              deactivatedAt: new Date(),
            },
          },
        )
      }
    }
  }

  return {
    checked: recipients.length,
    successful,
    failed,
    expired,
  }
}
