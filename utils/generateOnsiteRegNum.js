import OnsiteBadge from '../models/OnsiteBadge.js'

/**
 * GENERATE UNIQUE ONSITE REG NUMBER
 *
 * TYPES:
 * SPOT
 * SPONSOR
 */

export const generateOnsiteRegNum = async ({ eventId, type = 'SPOT' }) => {
  /**
   * PREFIX
   */

  const prefix = type === 'SPONSOR' ? 'SPONSOR' : 'SPOT'

  /**
   * FIND LAST REG NUM
   */

  const lastBadge = await OnsiteBadge.findOne({
    eventId,

    regNum: {
      $regex: `^${prefix}-`,
    },
  })
    .sort({ createdAt: -1 })
    .select('regNum')

  /**
   * DEFAULT START
   */

  let nextNumber = 1

  /**
   * EXTRACT LAST NUMBER
   */

  if (lastBadge?.regNum) {
    const match = lastBadge.regNum.match(/(\d+)$/)

    if (match?.[1]) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  /**
   * PAD NUMBER
   */

  const paddedNumber = String(nextNumber).padStart(4, '0')

  /**
   * FINAL REG NUM
   */

  return `${prefix}-${paddedNumber}`
}
