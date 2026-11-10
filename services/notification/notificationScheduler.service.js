import cron from 'node-cron'

import AppNotification from '../../models/AppNotification.js'
import {
  processClaimedNotification,
  reconcileExpoPushReceipts,
} from './notificationDelivery.service.js'

const MAX_NOTIFICATIONS_PER_RUN = 20
const STALE_PROCESSING_MINUTES = 30

let notificationSchedulerTask = null
let receiptReconciliationTask = null
let recoveryTask = null

let isSchedulerRunning = false
let isReceiptReconciliationRunning = false
let isRecoveryRunning = false

/**
 * Claims and processes due scheduled notifications.
 * MongoDB's findOneAndUpdate is the cross-instance lock.
 */
export const processDueNotifications = async () => {
  if (isSchedulerRunning) return
  isSchedulerRunning = true

  try {
    let processedCount = 0

    while (processedCount < MAX_NOTIFICATIONS_PER_RUN) {
      const now = new Date()
      const notification = await AppNotification.findOneAndUpdate(
        {
          status: 'scheduled',
          scheduledAt: { $lte: now },
        },
        {
          $set: {
            status: 'processing',
            deliveryMode: 'scheduled',
            processingStartedAt: now,
            failureReason: null,
          },
          $inc: { attemptCount: 1 },
        },
        {
          new: true,
          sort: { scheduledAt: 1 },
        },
      )

      if (!notification) break
      processedCount += 1

      try {
        await processClaimedNotification(notification._id)
      } catch (error) {
        console.error(
          `Scheduled notification ${notification._id} failed:`,
          error,
        )
      }
    }

    if (processedCount > 0) {
      console.log(
        `Notification scheduler processed ${processedCount} notification(s)`,
      )
    }
  } catch (error) {
    console.error('Notification scheduler error:', error)
  } finally {
    isSchedulerRunning = false
  }
}

/**
 * Recover work interrupted by a process crash. deliveryMode is explicit,
 * so an immediate retry of an originally scheduled notification is not
 * accidentally returned to the scheduler.
 */
export const recoverStaleNotifications = async () => {
  const cutoff = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000,
  )

  let recovered = 0

  while (true) {
    const notification = await AppNotification.findOne({
      status: 'processing',
      processingStartedAt: { $lte: cutoff },
    })
      .select('_id deliveryMode scheduledAt')
      .sort({ processingStartedAt: 1 })
      .lean()

    if (!notification) break

    // scheduledAt fallback supports records created before deliveryMode existed.
    const shouldReturnToSchedule =
      notification.deliveryMode === 'scheduled' ||
      (!notification.deliveryMode && notification.scheduledAt)

    const nextStatus = shouldReturnToSchedule ? 'scheduled' : 'failed'

    const result = await AppNotification.updateOne(
      {
        _id: notification._id,
        status: 'processing',
        processingStartedAt: { $lte: cutoff },
      },
      {
        $set: {
          status: nextStatus,
          processingStartedAt: null,
          failureReason: 'Recovered after interrupted notification processing',
        },
      },
    )

    if (result.modifiedCount > 0) {
      recovered += 1
      console.log(`Recovered notification ${notification._id} -> ${nextStatus}`)
    }
  }

  return recovered
}

/**
 * Starts scheduler, receipt reconciliation, and crash recovery jobs.
 * Call only after MongoDB has connected.
 */
export const startNotificationScheduler = () => {
  if (notificationSchedulerTask) {
    console.log('Notification background jobs are already running')
    return
  }

  notificationSchedulerTask = cron.schedule('* * * * *', async () => {
    await processDueNotifications()
  })

  receiptReconciliationTask = cron.schedule('*/15 * * * *', async () => {
    if (isReceiptReconciliationRunning) return
    isReceiptReconciliationRunning = true

    try {
      const result = await reconcileExpoPushReceipts()
      if (result.checked > 0 || result.expired > 0) {
        console.log('Expo receipt reconciliation:', result)
      }
    } catch (error) {
      console.error('Expo receipt reconciliation failed:', error)
    } finally {
      isReceiptReconciliationRunning = false
    }
  })

  recoveryTask = cron.schedule('*/5 * * * *', async () => {
    if (isRecoveryRunning) return
    isRecoveryRunning = true

    try {
      const recovered = await recoverStaleNotifications()
      if (recovered > 0) {
        console.log(`Recovered ${recovered} stale notification(s)`)
      }
    } catch (error) {
      console.error('Notification recovery failed:', error)
    } finally {
      isRecoveryRunning = false
    }
  })

  console.log('Notification background jobs started')
}

export const stopNotificationScheduler = () => {
  notificationSchedulerTask?.stop()
  receiptReconciliationTask?.stop()
  recoveryTask?.stop()

  notificationSchedulerTask = null
  receiptReconciliationTask = null
  recoveryTask = null

  console.log('Notification background jobs stopped')
}
