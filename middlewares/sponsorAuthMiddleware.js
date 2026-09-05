// middlewares/sponsorAuthMiddleware.js

import jwt from 'jsonwebtoken'
import Sponsor from '../models/Sponsor.js'

// =======================
// Protect Sponsor Routes
// =======================
export const protectSponsor = async (req, res, next) => {
  let token

  try {
    // ============================
    // Get token from Authorization
    // header
    // ============================
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // ============================
    // Fallback to HTTP-only cookie
    // ============================
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    // ============================
    // No token
    // ============================
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      })
    }

    // ============================
    // Verify access token
    // ============================
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ============================
    // Validate JWT payload
    // ============================
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      })
    }

    // ============================
    // Make sure token belongs to
    // a Sponsor
    // ============================
    if (decoded.role !== 'sponsor') {
      return res.status(403).json({
        success: false,
        message: 'Sponsor access required',
      })
    }

    // ============================
    // Find Sponsor
    //
    // Password fields are no longer
    // part of Sponsor authentication.
    // ============================
    const sponsor = await Sponsor.findById(decoded.id)

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
        message: 'Sponsor account is inactive',
      })
    }

    // ============================
    // Validate event context
    //
    // The Sponsor JWT must contain
    // the eventId associated with
    // this Sponsor.
    // ============================
    const sponsorEventId = sponsor.eventId?.toString()

    const tokenEventId = decoded.eventId?.toString()

    if (!sponsorEventId) {
      return res.status(403).json({
        success: false,
        message: 'Sponsor is not associated with an event',
      })
    }

    if (!tokenEventId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token: event context missing',
      })
    }

    // ============================
    // Prevent token/event mismatch
    // ============================
    if (sponsorEventId !== tokenEventId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token: event mismatch',
      })
    }

    // ============================
    // Attach Sponsor to request
    // ============================
    req.sponsor = sponsor

    // ============================
    // Attach authenticated event ID
    // for downstream controllers
    // ============================
    req.sponsorEventId = sponsorEventId

    // ============================
    // Continue
    // ============================
    next()
  } catch (error) {
    console.error('Sponsor authentication error:', error)

    // ============================
    // JWT errors
    // ============================
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      })
    }

    // ============================
    // General authentication error
    // ============================
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    })
  }
}
