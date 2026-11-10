
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'

const PUSH_BATCH_SIZE = 100
const RECEIPT_BATCH_SIZE = 1000

const chunkArray = (items, size) => {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

/**
 * Sends push notifications through Expo Push Service.
 *
 * Each returned ticket corresponds to the message at the same index
 * in the submitted messages array.
 */
export const sendExpoPushNotifications = async (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const batches = chunkArray(messages, PUSH_BATCH_SIZE)
  const allTickets = []

  for (const batch of batches) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    const result = await response.json()

    if (!response.ok || result?.errors?.length) {
      const error = new Error(
        result?.errors?.[0]?.message ||
          `Expo Push API request failed with status ${response.status}`
      )

      error.details = result?.errors
      throw error
    }

    if (!Array.isArray(result?.data)) {
      throw new Error('Invalid response received from Expo Push Service')
    }

    allTickets.push(...result.data)
  }

  return allTickets
}

/**
 * Retrieves delivery receipts for Expo push ticket IDs.
 *
 * A receipt can indicate whether Expo successfully handed the
 * notification to the underlying push notification service.
 */
export const getExpoPushReceipts = async (ticketIds = []) => {
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return {}
  }

  const batches = chunkArray(ticketIds, RECEIPT_BATCH_SIZE)
  const allReceipts = {}

  for (const batch of batches) {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: batch,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result?.errors?.[0]?.message ||
          `Expo receipt request failed with status ${response.status}`
      )
    }

    Object.assign(allReceipts, result?.data || {})
  }

  return allReceipts
}
