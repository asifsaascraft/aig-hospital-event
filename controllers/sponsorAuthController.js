// controllers/sponsorAuthController.js

import Sponsor from '../models/Sponsor.js'
import jwt from 'jsonwebtoken'
import { generateSponsorTokens } from '../utils/generateSponsorTokens.js'

// =======================
// Sponsor Login
// =======================
export const loginSponsor = async (req, res) => {
  try {
    const { loginToken } = req.body

    // ============================
    // Validate login token
    // ============================
    if (!loginToken || typeof loginToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Login token is required',
      })
    }

    const normalizedLoginToken = loginToken.trim()

    if (!normalizedLoginToken) {
      return res.status(400).json({
        success: false,
        message: 'Login token is required',
      })
    }

    // ============================
    // Find Sponsor by login token
    // ============================
    const sponsor = await Sponsor.findOne({
      loginToken: normalizedLoginToken,
    }).populate('eventId', 'eventName startDateTime endDateTime')

    if (!sponsor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login token',
      })
    }

    // ============================
    // Check Sponsor status
    // ============================
    if (sponsor.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact event admin.',
      })
    }

    // ============================
    // Make sure Sponsor has event
    // ============================
    if (!sponsor.eventId) {
      return res.status(403).json({
        success: false,
        message: 'No event associated with this sponsor',
      })
    }

    // ============================
    // Generate Sponsor tokens
    //
    // Access token contains:
    // - Sponsor ID
    // - Sponsor role
    // - Event ID
    //
    // Refresh token contains:
    // - Sponsor ID
    // - Sponsor role
    // - Event ID
    // ============================
    const { accessToken, refreshToken } = generateSponsorTokens(
      sponsor._id,
      sponsor.eventId._id,
    )

    // ============================
    // Access Token Cookie
    // ============================
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    })

    // ============================
    // Refresh Token Cookie
    // ============================
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    // ============================
    // Login Response
    // ============================
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: sponsor._id,
        eventId: sponsor.eventId,
        name: sponsor.contactPersonName,
        sponsorName: sponsor.sponsorName,
        accessToken,
      },
    })
  } catch (error) {
    console.error('Sponsor login error:', error)

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    })
  }
}

// =======================
// Sponsor Logout
// =======================
export const logoutSponsor = async (req, res) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })

    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Sponsor logout error:', error)

    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    })
  }
}

// =======================
// Refresh Access Token
// =======================
export const refreshAccessTokenSponsor = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      })
    }

    // ============================
    // Verify refresh token
    // ============================
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      })
    }

    // ============================
    // Find Sponsor
    // ============================
    const sponsor = await Sponsor.findById(decoded.id).select(
      '_id eventId sponsorName contactPersonName status',
    )

    if (!sponsor) {
      return res.status(401).json({
        success: false,
        message: 'Sponsor not found',
      })
    }

    // ============================
    // Check Sponsor status
    // ============================
    if (sponsor.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact event admin.',
      })
    }

    // ============================
    // Make sure Sponsor has event
    // ============================
    if (!sponsor.eventId) {
      return res.status(401).json({
        success: false,
        message: 'No event associated with this sponsor',
      })
    }

    // ============================
    // Generate new access token
    // ============================
    const { accessToken } = generateSponsorTokens(sponsor._id, sponsor.eventId)

    // ============================
    // Set new access token cookie
    // ============================
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    })

    // ============================
    // Response
    // ============================
    res.json({
      success: true,
      accessToken,
    })
  } catch (error) {
    console.error('Sponsor refresh token error:', error)

    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message,
    })
  }
}

// =======================
// Get Sponsor's Event
// =======================
export const getMyEvent = async (req, res) => {
  try {
    const sponsorId = req.sponsor?._id || req.sponsor?.id

    if (!sponsorId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      })
    }

    // ============================
    // Fetch Sponsor and Event
    // ============================
    const sponsor = await Sponsor.findById(sponsorId).populate({
      path: 'eventId',
      populate: [
        { path: 'organizer' },
        { path: 'department' },
        { path: 'venueName' },
        { path: 'groupName' },
      ],
      options: {
        sort: { createdAt: -1 },
      },
    })

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found',
      })
    }

    // ============================
    // Check Event
    // ============================
    if (!sponsor.eventId) {
      return res.status(404).json({
        success: false,
        message: 'No event associated with this sponsor',
      })
    }

    // ============================
    // Response
    // ============================
    res.json({
      success: true,
      message: 'Event fetched successfully',
      event: sponsor.eventId.toObject({
        virtuals: true,
      }),
      sponsor: {
        _id: sponsor._id,
        sponsorName: sponsor.sponsorName,
        contactPersonName: sponsor.contactPersonName,
        email: sponsor.email,
        mobile: sponsor.mobile,
        status: sponsor.status,
      },
    })
  } catch (error) {
    console.error('Get sponsor event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message,
    })
  }
}
