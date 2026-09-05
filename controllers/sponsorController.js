import Sponsor from '../models/Sponsor.js'
import { generateSponsorLoginToken } from '../utils/generateSponsorTokens.js'
import SponsorRegistrationQuota from '../models/SponsorRegistrationQuota.js'
import SponsorAccomodationQuota from '../models/SponsorAccomodationQuota.js'
import SponsorTravelQuota from '../models/SponsorTravelQuota.js'
import EventRegistration from '../models/EventRegistration.js'
import Accomodation from '../models/Accomodation.js'
import Travel from '../models/Travel.js'
import Event from '../models/Event.js'

// =======================
// Get all sponsors by Event ID (Public/User)
// =======================
export const getSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const sponsors = await Sponsor.find({ eventId })
      .sort({ createdAt: -1 })
      .populate('eventId', 'eventName')

    res.json({
      success: true,
      data: sponsors,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sponsors',
      error: error.message,
    })
  }
}

// =======================
// Get active sponsors by Event ID (Public/User)
// =======================
export const getActiveSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const sponsors = await Sponsor.find({
      eventId,
      status: 'Active',
    })
      .sort({ createdAt: -1 })
      .populate('eventId', 'eventName')

    res.json({
      success: true,
      data: sponsors,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sponsors',
      error: error.message,
    })
  }
}

// =======================
// Create sponsor (eventAdmin only)
// =======================
export const createSponsor = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      sponsorName,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      gstNumber,
      companyAddress,
      status,
    } = req.body

    // ============================
    // Validate required fields
    // ============================
    if (
      !eventId ||
      !sponsorName ||
      !contactPersonName ||
      !email ||
      !mobile ||
      !companyAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Required fields: eventId, sponsorName, contactPersonName, email, mobile, companyAddress',
      })
    }

    // ============================
    // Validate event exists
    // ============================
    const event = await Event.findById(eventId).select('_id')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // ============================
    // Normalize email
    // ============================
    const normalizedEmail = email.trim().toLowerCase()

    // ============================
    // Event-specific email check
    //
    // Same email is allowed in
    // different events.
    //
    // Same email in the same event
    // is not allowed.
    // ============================
    const existingSponsor = await Sponsor.findOne({
      eventId,
      email: normalizedEmail,
    })

    if (existingSponsor) {
      return res.status(400).json({
        success: false,
        message:
          'This email is already registered for this event. Please use a different email.',
      })
    }

    // ============================
    // Generate unique Sponsor login token
    // ============================
    const loginToken = await generateSponsorLoginToken()

    // ============================
    // Create Sponsor
    // ============================
    const sponsor = await Sponsor.create({
      eventId,
      sponsorName,
      contactPersonName,
      email: normalizedEmail,
      mobile,
      additionalEmail,
      loginToken,
      gstNumber,
      companyAddress,
      status: status || 'Active',
    })

    // ============================
    // Return Sponsor credentials
    //
    // loginToken is intentionally
    // returned because Event Admin
    // needs to provide it to Sponsor.
    // ============================
    res.status(201).json({
      success: true,
      message: 'Sponsor created successfully',
      data: sponsor,
      loginToken,
    })
  } catch (error) {
    // ============================
    // Handle MongoDB duplicate key
    // ============================
    if (error?.code === 11000) {
      const duplicateFields = Object.keys(error.keyPattern || {})

      if (
        duplicateFields.includes('eventId') &&
        duplicateFields.includes('email')
      ) {
        return res.status(400).json({
          success: false,
          message:
            'This email is already registered for this event. Please use a different email.',
        })
      }

      if (duplicateFields.includes('loginToken')) {
        return res.status(500).json({
          success: false,
          message:
            'Failed to generate a unique Sponsor login credential. Please try again.',
        })
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create sponsor',
      error: error.message,
    })
  }
}

// =======================
// Update sponsor (eventAdmin only)
// =======================
export const updateSponsor = async (req, res) => {
  try {
    const { id } = req.params

    const updatedData = { ...req.body }

    // ============================
    // Fetch current sponsor
    // ============================
    const sponsor = await Sponsor.findById(id)

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found',
      })
    }

    // ============================
    // Prevent changing protected
    // authentication fields
    // ============================
    delete updatedData.loginToken
    delete updatedData.password
    delete updatedData.plainPassword
    delete updatedData.resetPasswordToken
    delete updatedData.resetPasswordExpire

    // ============================
    // Normalize email if provided
    // ============================
    if (updatedData.email) {
      updatedData.email = updatedData.email.trim().toLowerCase()
    }

    // ============================
    // Determine final email
    // ============================
    const finalEmail = updatedData.email || sponsor.email

    // ============================
    // Event-specific email check
    //
    // The email only needs to be
    // unique within this Sponsor's
    // event.
    // ============================
    const duplicateSponsor = await Sponsor.findOne({
      eventId: sponsor.eventId,
      email: finalEmail,
      _id: { $ne: id },
    })

    if (duplicateSponsor) {
      return res.status(400).json({
        success: false,
        message:
          'This email is already registered for this event. Please use a different email.',
      })
    }

    // ============================
    // Prevent changing Sponsor event
    // through update request
    // ============================
    delete updatedData.eventId

    // ============================
    // Update sponsor
    // ============================
    const updatedSponsor = await Sponsor.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      data: updatedSponsor,
    })
  } catch (error) {
    // ============================
    // Handle MongoDB duplicate key
    // ============================
    if (error?.code === 11000) {
      const duplicateFields = Object.keys(error.keyPattern || {})

      if (
        duplicateFields.includes('eventId') &&
        duplicateFields.includes('email')
      ) {
        return res.status(400).json({
          success: false,
          message:
            'This email is already registered for this event. Please use a different email.',
        })
      }

      if (duplicateFields.includes('loginToken')) {
        return res.status(500).json({
          success: false,
          message:
            'Sponsor login credential conflict. Please try updating again.',
        })
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update sponsor',
      error: error.message,
    })
  }
}

// =======================
// Delete sponsor (eventAdmin only)
// =======================
export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params

    const sponsor = await Sponsor.findByIdAndDelete(id)

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found',
      })
    }

    res.json({
      success: true,
      message: 'Sponsor deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete sponsor',
      error: error.message,
    })
  }
}

// =======================
// GET SUMMARY BY EVENT
// =======================
export const getSponsorSummary = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Fetch event name
    // =======================
    const event = await Event.findById(eventId).select('eventName')

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      })
    }

    // =======================
    // 1. SPONSORS
    // =======================
    const sponsors = await Sponsor.find({ eventId })

    const totalSponsors = sponsors.length

    const activeSponsors = sponsors.filter((s) => s.status === 'Active').length

    const inactiveSponsors = sponsors.filter(
      (s) => s.status === 'Inactive',
    ).length

    // =======================
    // 2. REGISTRATION QUOTA
    // =======================
    const regQuotas = await SponsorRegistrationQuota.find({
      eventId,
    })

    const totalRegQuota = regQuotas.reduce((sum, q) => sum + q.quota, 0)

    // Count ONLY sponsor registrations (valid ones)
    const totalRegUsed = await EventRegistration.countDocuments({
      eventId,
      registrationType: 'Sponsor Registration',
      isSuspended: false,
    })

    // Remaining = total quota - used
    const totalRegRemaining = Math.max(totalRegQuota - totalRegUsed, 0)

    // =======================
    // 3. ACCOMODATION QUOTA
    // =======================
    const accQuotas = await SponsorAccomodationQuota.find({
      eventId,
    })

    const totalAccQuota = accQuotas.reduce((sum, q) => {
      const quotaSum = q.quotas.reduce(
        (innerSum, item) => innerSum + item.numberOfQuota,
        0,
      )

      return sum + quotaSum
    }, 0)

    const accomodations = await Accomodation.find({
      eventId,
    })

    const totalAccUsed = accomodations.reduce(
      (sum, booking) => sum + booking.accomodationDays.length,
      0,
    )

    const totalAccRemaining = Math.max(totalAccQuota - totalAccUsed, 0)

    // =======================
    // 4. TRAVEL QUOTA
    // =======================
    const travelQuotas = await SponsorTravelQuota.find({
      eventId,
    })

    const totalTravelQuota = travelQuotas.reduce((sum, q) => sum + q.quota, 0)

    const totalTravelUsed = await Travel.countDocuments({
      eventId,
    })

    const totalTravelRemaining = Math.max(totalTravelQuota - totalTravelUsed, 0)

    // =======================
    // 5. PER SPONSOR DATA
    // =======================
    const sponsorDetails = await Promise.all(
      sponsors.map(async (sponsor) => {
        const reg = await SponsorRegistrationQuota.findOne({
          sponsorId: sponsor._id,
        })

        const acc = await SponsorAccomodationQuota.findOne({
          sponsorId: sponsor._id,
        })

        const travel = await SponsorTravelQuota.findOne({
          sponsorId: sponsor._id,
        })

        // =======================
        // REGISTRATION USED
        // =======================
        const registrationUsed = await EventRegistration.countDocuments({
          eventId,
          sponsorId: sponsor._id,
          registrationType: 'Sponsor Registration',
          isSuspended: false,
        })

        // =======================
        // ACCOMODATION QUOTA
        // =======================
        const accomodationQuota =
          acc?.quotas?.reduce((sum, item) => sum + item.numberOfQuota, 0) || 0

        // =======================
        // ACCOMODATION USED
        // =======================
        const sponsorAccomodations = await Accomodation.find({
          eventId,
          sponsorId: sponsor._id,
        })

        const accomodationUsed = sponsorAccomodations.reduce(
          (sum, booking) => sum + booking.accomodationDays.length,
          0,
        )

        // =======================
        // TRAVEL USED
        // =======================
        const travelUsed = await Travel.countDocuments({
          eventId,
          sponsorId: sponsor._id,
        })

        return {
          sponsorName: sponsor.sponsorName,

          // =======================
          // REGISTRATION
          // =======================
          registrationQuota: reg?.quota || 0,

          registrationUsed,

          registrationRemaining: Math.max(
            (reg?.quota || 0) - registrationUsed,
            0,
          ),

          // =======================
          // ACCOMODATION
          // =======================
          accomodationQuota,

          accomodationUsed,

          accomodationRemaining: Math.max(
            accomodationQuota - accomodationUsed,
            0,
          ),

          // =======================
          // TRAVEL
          // =======================
          travelQuota: travel?.quota || 0,

          travelUsed,

          travelRemaining: Math.max((travel?.quota || 0) - travelUsed, 0),
        }
      }),
    )

    // =======================
    // FINAL RESPONSE
    // =======================
    res.status(200).json({
      success: true,
      data: {
        eventName: event.eventName,

        sponsors: {
          total: totalSponsors,
          active: activeSponsors,
          inactive: inactiveSponsors,
        },

        registrationQuota: {
          total: totalRegQuota,
          used: totalRegUsed,
          remaining: totalRegRemaining,
        },

        accomodationQuota: {
          total: totalAccQuota,
          used: totalAccUsed,
          remaining: totalAccRemaining,
        },

        travelQuota: {
          total: totalTravelQuota,
          used: totalTravelUsed,
          remaining: totalTravelRemaining,
        },

        sponsorBreakdown: sponsorDetails,
      },
    })
  } catch (error) {
    console.error('Summary Error:', error)

    res.status(500).json({
      message: 'Server Error',
    })
  }
}
