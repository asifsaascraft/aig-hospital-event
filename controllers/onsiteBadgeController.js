import axios from 'axios'
import mongoose from 'mongoose'
import XLSX from 'xlsx'
import OnsiteBadge from '../models/onsiteBadge.js'
import CardProfile from '../models/CardProfile.js'
import { generateOnsiteRegNum } from '../utils/generateOnsiteRegNum.js'
import QRCode from 'qrcode'
import Event from '../models/Event.js'
import sendEmailWithTemplate from '../utils/sendEmail.js'
import { getIndianFormattedDateTime } from '../utils/dateUtils.js'

export const importRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event id',
      })
    }

    /**
     * FETCH REGISTRATIONS
     */

    const registrationResponse = await axios.get(
      `${process.env.BASE_URL}/api/event-admin/events/${eventId}/registrations`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    )

    const registrations = registrationResponse?.data?.data || []

    if (!registrations.length) {
      return res.status(404).json({
        success: false,
        message: 'No registrations found',
      })
    }

    const operations = []

    let importedCount = 0
    let updatedCount = 0

    for (const registration of registrations) {
      /**
       * HANDLE CARD PROFILE
       *
       * SUPPORTS:
       * 1. populated object
       * 2. raw objectId
       * 3. missing profile
       */

      let badgeProfileId = null
      let badgeProfileName = 'Delegate'

      /**
       * CASE 1
       * POPULATED OBJECT
       */

      if (
        registration?.cardProfileId &&
        typeof registration.cardProfileId === 'object' &&
        registration.cardProfileId?.CardProfileName
      ) {
        badgeProfileId = registration.cardProfileId._id || null

        badgeProfileName =
          registration.cardProfileId.CardProfileName || 'Delegate'
      } else if (registration?.cardProfileId) {
        /**
         * CASE 2
         * RAW OBJECT ID
         */
        const badgeProfile = await BadgeProfile.findById(
          registration.cardProfileId,
        ).select('_id CardProfileName')

        if (badgeProfile) {
          badgeProfileId = badgeProfile._id

          badgeProfileName = badgeProfile.CardProfileName || 'Delegate'
        }
      }

      /**
       * UNIQUE KEY
       */

      const uniqueCompositeKey = `${eventId}-registration-${registration._id}`

      /**
       * TRANSFORM DATA
       */

      const transformedData = {
        eventId,

        sourceType: 'registration',

        sourceId: registration._id,

        prefix: registration.prefix || '',

        name: registration.name || '',

        gender: registration.gender || '',

        email: registration.email || '',

        mobile: registration.mobile || '',

        designation: registration.designation || '',

        affiliation: registration.affiliation || '',

        department: registration.department || '',

        city: registration.city || '',

        state: registration.state || '',

        country: registration.country || '',

        address: registration.address || '',

        pincode: registration.pincode || '',

        mciNumber: registration.mciNumber || '',

        mciState: registration.mciState || '',

        regNum: registration.regNum || '',

        registrationType: registration.registrationType || '',

        /**
         * IMPORTANT
         */

        badgeProfileId,

        badgeProfileName,

        sponsorId: registration?.sponsorId?._id || null,

        sponsorName: registration?.sponsorId?.sponsorName || '',

        parentRegistrationId: registration._id,

        isPaid: registration.isPaid || false,

        isSuspended: registration.isSuspended || false,

        uniqueCompositeKey,
      }

      /**
       * CHECK EXISTING
       */

      const alreadyExists = await OnsiteBadge.findOne({
        uniqueCompositeKey,
      }).select('_id')

      if (alreadyExists) {
        updatedCount++
      } else {
        importedCount++
      }

      /**
       * UPSERT
       */

      operations.push({
        updateOne: {
          filter: {
            uniqueCompositeKey,
          },

          update: {
            $set: transformedData,
          },

          upsert: true,
        },
      })
    }

    /**
     * BULK WRITE
     */

    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations)
    }

    return res.status(200).json({
      success: true,

      message: 'Registrations imported successfully',

      stats: {
        totalFetched: registrations.length,

        imported: importedCount,

        updated: updatedCount,
      },
    })
  } catch (error) {
    console.error('IMPORT REGISTRATIONS ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to import registrations',

      error: error.message,
    })
  }
}

// =======================fetch Accompany ======//

export const importAccompanies = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event id',
      })
    }

    /**
     * FETCH ACCOMPANIES API
     */

    const accompanyResponse = await axios.get(
      `${process.env.BASE_URL}/api/accompanies/event-admin/events/${eventId}/paid`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    )

    const accompanyData = accompanyResponse?.data?.data || []

    if (!accompanyData.length) {
      return res.status(404).json({
        success: false,
        message: 'No accompanies found',
      })
    }

    const operations = []

    let importedCount = 0
    let updatedCount = 0
    let totalAccompanies = 0

    /**
     * LOOP MAIN DATA
     */

    for (const item of accompanyData) {
      const registration = item?.registration || {}

      const paidAccompanies = item?.paidAccompanies || []

      /**
       * HANDLE CARD PROFILE
       */

      let badgeProfileId = null
      let badgeProfileName = 'Accompany'

      /**
       * POPULATED OBJECT
       */

      if (
        registration?.cardProfileId &&
        typeof registration.cardProfileId === 'object' &&
        registration.cardProfileId?.CardProfileName
      ) {
        badgeProfileId = registration.cardProfileId._id || null

        badgeProfileName =
          registration.cardProfileId.CardProfileName || 'Accompany'
      } else if (registration?.cardProfileId) {
        /**
         * RAW OBJECT ID
         */
        const badgeProfile = await CardProfile.findById(
          registration.cardProfileId,
        ).select('_id CardProfileName')

        if (badgeProfile) {
          badgeProfileId = badgeProfile._id

          badgeProfileName = badgeProfile.CardProfileName || 'Accompany'
        }
      }

      /**
       * LOOP PAID ACCOMPANIES
       */

      for (const accompany of paidAccompanies) {
        totalAccompanies++

        /**
         * UNIQUE KEY
         */

        const uniqueCompositeKey = `${eventId}-accompany-${accompany._id}`

        /**
         * TRANSFORM DATA
         */

        const transformedData = {
          eventId,

          sourceType: 'accompany',

          sourceId: accompany._id,

          prefix: accompany.prefix || '',

          name: accompany.fullName || accompany.name || '',

          gender: accompany.gender || '',

          email: accompany.email || '',

          mobile: accompany.mobile || '',

          designation: accompany.designation || '',

          affiliation: registration.affiliation || '',

          department: registration.department || '',

          city: registration.city || '',

          state: registration.state || '',

          country: registration.country || '',

          address: registration.address || '',

          pincode: registration.pincode || '',

          regNum: accompany.regNum || '',

          registrationType: 'Accompany',

          badgeProfileId,

          badgeProfileName,

          sponsorId: registration?.sponsorId?._id || null,

          sponsorName: registration?.sponsorId?.sponsorName || '',

          parentRegistrationId: registration._id,

          isPaid: true,

          isSuspended: false,

          uniqueCompositeKey,
        }

        /**
         * CHECK EXISTING
         */

        const alreadyExists = await OnsiteBadge.findOne({
          uniqueCompositeKey,
        }).select('_id')

        if (alreadyExists) {
          updatedCount++
        } else {
          importedCount++
        }

        /**
         * UPSERT
         */

        operations.push({
          updateOne: {
            filter: {
              uniqueCompositeKey,
            },

            update: {
              $set: transformedData,
            },

            upsert: true,
          },
        })
      }
    }

    /**
     * BULK WRITE
     */

    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations)
    }

    return res.status(200).json({
      success: true,

      message: 'Accompanies imported successfully',

      stats: {
        totalFetched: totalAccompanies,

        imported: importedCount,

        updated: updatedCount,
      },
    })
  } catch (error) {
    console.error('IMPORT ACCOMPANIES ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to import accompanies',

      error: error.message,
    })
  }
}

//====== Sponsor CSV / Excel Import ======//

export const importSponsorExcel = async (req, res) => {
  try {
    const { eventId } = req.params
    const { badgeProfileId } = req.body

    /**
     * VALIDATIONS
     */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      })
    }

    if (!badgeProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Badge profile is required',
      })
    }

    /**
     * FIND SELECTED BADGE PROFILE
     */

    const selectedBadgeProfile = await CardProfile.findById(
      badgeProfileId,
    ).select('_id CardProfileName')

    if (!selectedBadgeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Selected badge profile not found',
      })
    }

    /**
     * READ FILE FROM S3
     */

    const response = await axios.get(req.file.location, {
      responseType: 'arraybuffer',
    })

    /**
     * PARSE EXCEL
     */

    const workbook = XLSX.read(response.data, {
      type: 'buffer',
    })

    const sheetName = workbook.SheetNames[0]

    const worksheet = workbook.Sheets[sheetName]

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
    })

    /**
     * EMPTY FILE CHECK
     */

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty',
      })
    }

    /**
     * IMPORT BATCH ID
     */

    const importBatchId = `SPONSOR-${Date.now()}`

    /**
     * STATS
     */

    let imported = 0
    let updated = 0
    let skipped = 0

    const duplicates = []
    const invalidRows = []

    const operations = []

    /**
     * LOCAL DUPLICATE TRACKER
     */

    const localDuplicateSet = new Set()

    /**
     * FIND LAST SPONSOR REG NUM
     */

    const lastSponsorBadge = await OnsiteBadge.findOne({
      eventId,

      regNum: {
        $regex: '^SPONSOR-',
      },
    })
      .sort({ createdAt: -1 })
      .select('regNum')

    let sponsorCounter = 1

    if (lastSponsorBadge?.regNum) {
      const match = lastSponsorBadge.regNum.match(/(\d+)$/)

      if (match?.[1]) {
        sponsorCounter = parseInt(match[1], 10) + 1
      }
    }

    /**
     * LOOP ROWS
     */

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]

      /**
       * NORMALIZE DATA
       */

      const name = String(row.name || '').trim()

      const email = String(row.email || '')
        .trim()
        .toLowerCase()

      const mobile = String(row.mobile || '').trim()

      const designation = String(row.designation || '').trim()

      const affiliation = String(row.affiliation || '').trim()

      const department = String(row.department || '').trim()

      const city = String(row.city || '').trim()

      const state = String(row.state || '').trim()

      const country = String(row.country || '').trim()

      /**
       * VALIDATION
       */

      if (!name) {
        invalidRows.push({
          row: index + 2,
          reason: 'Name is required',
        })

        skipped++
        continue
      }

      /**
       * REQUIRE EMAIL OR MOBILE
       */

      if (!email && !mobile) {
        invalidRows.push({
          row: index + 2,
          reason: 'Email or mobile is required',
        })

        skipped++
        continue
      }

      /**
       * LOCAL DUPLICATE CHECK
       */

      const duplicateKey = `${eventId}-${email}-${mobile}`

      if (localDuplicateSet.has(duplicateKey)) {
        duplicates.push({
          row: index + 2,
          reason: 'Duplicate inside uploaded file',
        })

        skipped++
        continue
      }

      localDuplicateSet.add(duplicateKey)

      /**
       * FIND EXISTING RECORD
       */

      const existingRecord = await OnsiteBadge.findOne({
        eventId,
        isDeleted: false,

        $or: [
          ...(email ? [{ email }] : []),
          ...(mobile ? [{ mobile }] : []),
        ],
      }).select('_id regNum')

      /**
       * UNIQUE KEY
       */

      const uniqueCompositeKey = `${eventId}-sponsor_csv-${email}-${mobile}`

      /**
       * KEEP OLD REG NUM IF EXISTS
       */

      let regNum = existingRecord?.regNum

      if (!regNum) {
        regNum = `SPONSOR-${String(sponsorCounter).padStart(4, '0')}`

        sponsorCounter++
      }

      /**
       * TRANSFORM DATA
       */

      const transformedData = {
        eventId,

        sourceType: 'sponsor_csv',

        sourceId: uniqueCompositeKey,

        name,

        email,

        mobile,

        regNum,

        designation,

        affiliation,

        department,

        city,

        state,

        country,

        badgeProfileId: selectedBadgeProfile._id,

        badgeProfileName:
          selectedBadgeProfile.CardProfileName,

        badgePrinted: false,

        printCount: 0,

        isPaid: true,

        isSuspended: false,

        importBatchId,

        uniqueCompositeKey,
      }

      /**
       * STATS
       */

      if (existingRecord) {
        updated++
      } else {
        imported++
      }

      /**
       * UPSERT
       */

      operations.push({
        updateOne: {
          filter: existingRecord
            ? { _id: existingRecord._id }
            : { uniqueCompositeKey },

          update: {
            $set: transformedData,
          },

          upsert: true,
        },
      })
    }

    /**
     * BULK WRITE
     */

    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations)
    }

    /**
     * SUCCESS
     */

    return res.status(200).json({
      success: true,

      message: 'Sponsor excel imported successfully',

      fileUrl: req.file.location,

      badgeProfile: {
        id: selectedBadgeProfile._id,
        name: selectedBadgeProfile.CardProfileName,
      },

      stats: {
        totalRows: rows.length,

        imported,

        updated,

        skipped,

        duplicates,

        invalidRows,
      },
    })
  } catch (error) {
    console.error('SPONSOR IMPORT ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to import sponsor excel',

      error: error.message,
    })
  }
}

//====== Add Manual Badge Functionality ======//

export const createManualBadge = async (req, res) => {
  try {
    const { eventId } = req.params

    const { prefix, name, gender, cardProfileId, email, mobile } = req.body

    /**
     * VALIDATION
     */

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      })
    }

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required',
      })
    }

    /**
     * FIND CARD PROFILE
     */

    let badgeProfile = await CardProfile.findById(cardProfileId).select(
      '_id CardProfileName',
    )

    /**
     * FALLBACK
     */

    if (!badgeProfile) {
      badgeProfile = await CardProfile.findOne({
        CardProfileName: 'Delegate',
      }).select('_id CardProfileName')
    }

    /**
     * DUPLICATE CHECK
     */

    const existingRecord = await OnsiteBadge.findOne({
      eventId,

      $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
    })

    if (existingRecord) {
      return res.status(409).json({
        success: false,

        message: 'Badge already exists with same email or mobile',
      })
    }

    /**
     * UNIQUE KEY
     */

    const uniqueCompositeKey = `${eventId}-manual-${email}-${mobile}`

    /**
     * GENERATE REG NUM
     */

    const regNum = await generateOnsiteRegNum({
      eventId,
      type: 'SPOT',
    })

    /**
     * CREATE BADGE
     */

    const newBadge = await OnsiteBadge.create({
      eventId,

      sourceType: 'manual',

      sourceId: uniqueCompositeKey,

      prefix: prefix || 'Dr',

      name,

      gender,

      email: email || '',

      mobile: mobile || '',

      regNum,

      badgeProfileId: badgeProfile?._id || null,

      badgeProfileName: badgeProfile?.CardProfileName || 'Delegate',

      badgePrinted: false,

      printCount: 0,

      isPaid: true,

      isSuspended: false,

      uniqueCompositeKey,
    })

    return res.status(201).json({
      success: true,

      message: 'Manual badge created successfully',

      data: newBadge,
    })
  } catch (error) {
    console.error('CREATE MANUAL BADGE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to create manual badge',

      error: error.message,
    })
  }
}

//====== Update Manual Badge Functionality ======//

export const updateOnsiteBadge = async (req, res) => {
  try {
    const { badgeId } = req.params

    const { prefix, name, gender, cardProfileId, email, mobile } = req.body

    /**
     * FIND EXISTING
     */

    const existingBadge = await OnsiteBadge.findById(badgeId)

    if (!existingBadge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      })
    }

    /**
     * FIND CARD PROFILE
     */

    let badgeProfile = await CardProfile.findById(cardProfileId).select(
      '_id CardProfileName',
    )

    /**
     * FALLBACK
     */

    if (!badgeProfile) {
      badgeProfile = await CardProfile.findOne({
        CardProfileName: 'Delegate',
      }).select('_id CardProfileName')
    }

    /**
     * DUPLICATE CHECK
     */

    const duplicateBadge = await OnsiteBadge.findOne({
      _id: { $ne: badgeId },

      eventId: existingBadge.eventId,

      $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
    })

    if (duplicateBadge) {
      return res.status(409).json({
        success: false,

        message: 'Another badge already exists with same email or mobile',
      })
    }

    /**
     * UPDATE
     */

    existingBadge.prefix = prefix || 'Dr'

    existingBadge.name = name

    existingBadge.gender = gender

    existingBadge.email = email || ''

    existingBadge.mobile = mobile || ''

    existingBadge.badgeProfileId = badgeProfile?._id || null

    existingBadge.badgeProfileName = badgeProfile?.CardProfileName || 'Delegate'

    await existingBadge.save()

    return res.status(200).json({
      success: true,

      message: 'Badge updated successfully',

      data: existingBadge,
    })
  } catch (error) {
    console.error('UPDATE ONSITE BADGE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to update badge',

      error: error.message,
    })
  }
}

//====== Get All Onsite Badges ======//

export const getAllOnsiteBadges = async (req, res) => {
  try {
    const { eventId } = req.params

    /**
     * QUERY PARAMS
     */

    const {
      search = '',
      sourceType,
      badgePrinted,
      badgeProfileName,
    } = req.query

    /**
     * FILTER
     */

    const filter = {
      eventId,

      isDeleted: false,
    }

    /**
     * SEARCH
     */

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          mobile: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          regNum: {
            $regex: search,
            $options: 'i',
          },
        },
      ]
    }

    /**
     * SOURCE TYPE FILTER
     */

    if (sourceType) {
      filter.sourceType = sourceType
    }

    /**
     * PRINT FILTER
     */

    if (badgePrinted !== undefined) {
      filter.badgePrinted = badgePrinted === 'true'
    }

    /**
     * BADGE PROFILE FILTER
     */

    if (badgeProfileName) {
      filter.badgeProfileName = badgeProfileName
    }

    /**
     * FETCH ALL BADGES
     */

    const badges = await OnsiteBadge.find(filter).sort({
      createdAt: -1,
    })

    /**
     * TOTAL COUNT
     */

    const total = badges.length

    /**
     * RESPONSE
     */

    return res.status(200).json({
      success: true,

      total,

      data: badges,
    })
  } catch (error) {
    console.error('GET ALL ONSITE BADGES ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to fetch onsite badges',

      error: error.message,
    })
  }
}

//======== Send Badge Emails Functionality ======//

//========================================================
// SEND BULK BADGE EMAILS
//========================================================

export const sendBulkBadgeEmails = async (req, res) => {
  try {
    const { eventId } = req.params

    /**
     * EVENT
     */

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    /**
     * FETCH ONLY UNSENT BADGES
     */

    const badges = await OnsiteBadge.find({
      eventId,

      isDeleted: false,

      isSuspended: false,

      email: {
        $ne: '',
      },

      bulkEmailSent: false,
    })

    if (!badges.length) {
      return res.status(400).json({
        success: false,
        message: 'All badge emails already sent',
      })
    }

    let totalSent = 0

    let failedEmails = []

    /**
     * LOOP
     */

    for (const badge of badges) {
      try {
        /**
         * QR CODE
         */

        // const qrCode = await QRCode.toDataURL(badge.regNum) // OLD - USING QR CODE LIBRARY

        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          badge.regNum,
        )}`

        /**
         * SEND EMAIL
         */

        await sendEmailWithTemplate({
          to: badge.email,

          name: badge.name,

          templateKey:
            '2518b.554b0da719bc314.k1.13012a80-54ea-11f1-9ef1-d2cf08f4ca8c.19e4985ed28',

          mergeInfo: {
            name: badge.name,

            regNum: badge.regNum,

            eventName: event.eventName,

            startDateTime: getIndianFormattedDateTime(event.startDateTime),

            endDateTime: getIndianFormattedDateTime(event.endDateTime),

            qrCode,
          },
        })

        /**
         * UPDATE STATUS
         */

        badge.bulkEmailSent = true

        badge.bulkEmailSentAt = new Date()

        await badge.save()

        totalSent++
      } catch (emailError) {
        console.error(`Badge email failed for ${badge.email}`, emailError)

        failedEmails.push({
          email: badge.email,

          reason: emailError.message,
        })
      }
    }

    return res.status(200).json({
      success: true,

      message: 'Bulk badge emails sent successfully',

      totalSent,

      totalFailed: failedEmails.length,

      failedEmails,
    })
  } catch (error) {
    console.error('SEND BULK BADGE EMAIL ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to send bulk badge emails',

      error: error.message,
    })
  }
}

//========================================================
// SEND SINGLE BADGE EMAIL
//========================================================

export const sendSingleBadgeEmail = async (req, res) => {
  try {
    const { badgeId } = req.params

    /**
     * BADGE
     */

    const badge = await OnsiteBadge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      })
    }

    /**
     * EVENT
     */

    const event = await Event.findById(badge.eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    /**
     * EMAIL REQUIRED
     */

    if (!badge.email) {
      return res.status(400).json({
        success: false,
        message: 'Badge email not found',
      })
    }

    /**
     * QR CODE
     */

    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      badge.regNum,
    )}`

    /**
     * SEND EMAIL
     */

    await sendEmailWithTemplate({
      to: badge.email,

      name: badge.name,

      templateKey:
        '2518b.554b0da719bc314.k1.13012a80-54ea-11f1-9ef1-d2cf08f4ca8c.19e4985ed28',

      mergeInfo: {
        name: badge.name,

        regNum: badge.regNum,

        eventName: event.eventName,

        startDateTime: getIndianFormattedDateTime(event.startDateTime),

        endDateTime: getIndianFormattedDateTime(event.endDateTime),

        qrCode,
      },
    })

    /**
     * UPDATE STATUS
     */

    badge.singleEmailSent = true

    badge.singleEmailSentAt = new Date()

    await badge.save()

    return res.status(200).json({
      success: true,

      message: 'Badge email sent successfully',
    })
  } catch (error) {
    console.error('SEND SINGLE BADGE EMAIL ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to send badge email',

      error: error.message,
    })
  }
}

//======== Onsite Badge Search Controller ======//

export const searchOnsiteBadges = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      search = '',
      page = 1,
      limit = 20,
      badgePrinted,
      badgeProfileName,
      sourceType,
    } = req.query

    /**
     * PAGINATION
     */

    const currentPage = parseInt(page)

    const pageLimit = parseInt(limit)

    const skip = (currentPage - 1) * pageLimit

    /**
     * FILTER
     */

    const filter = {
      eventId,

      isDeleted: false,
    }

    /**
     * SEARCH
     */

    if (search) {
      filter.$or = [
        {
          regNum: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          mobile: {
            $regex: search,
            $options: 'i',
          },
        },
      ]
    }

    /**
     * FILTERS
     */

    if (badgePrinted !== undefined) {
      filter.badgePrinted = badgePrinted === 'true'
    }

    if (badgeProfileName) {
      filter.badgeProfileName = badgeProfileName
    }

    if (sourceType) {
      filter.sourceType = sourceType
    }

    /**
     * FETCH
     */

    const data = await OnsiteBadge.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageLimit)

    /**
     * TOTAL
     */

    const total = await OnsiteBadge.countDocuments(filter)

    return res.status(200).json({
      success: true,

      total,

      currentPage,

      totalPages: Math.ceil(total / pageLimit),

      data,
    })
  } catch (error) {
    console.error('SEARCH ONSITE BADGES ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to search badges',

      error: error.message,
    })
  }
}

//========= Badge Print Controller ======//

export const printBadge = async (req, res) => {
  try {
    const { badgeId } = req.params

    /**
     * FIND BADGE
     */

    const badge = await OnsiteBadge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({
        success: false,

        message: 'Badge not found',
      })
    }

    /**
     * UPDATE
     */

    badge.badgePrinted = true

    badge.printCount = (badge.printCount || 0) + 1

    badge.lastPrintedAt = new Date()

    /**
     * PRINT LOG
     */

    badge.printLogs.push({
      printedAt: new Date(),

      printedBy: req.user?._id || null,

      reprint: badge.printCount > 1,
    })

    await badge.save()

    return res.status(200).json({
      success: true,

      message:
        badge.printCount > 1
          ? 'Badge reprinted successfully'
          : 'Badge printed successfully',

      data: badge,
    })
  } catch (error) {
    console.error('PRINT BADGE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to print badge',

      error: error.message,
    })
  }
}