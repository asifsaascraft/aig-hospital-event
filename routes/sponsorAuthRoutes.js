import express from 'express'

import {
  loginSponsor,
  logoutSponsor,
  refreshAccessTokenSponsor,
  getMyEvent,
} from '../controllers/sponsorAuthController.js'

import { protectSponsor } from '../middlewares/sponsorAuthMiddleware.js'

const router = express.Router()

// =======================
// Sponsor Authentication
// =======================

// Login using Sponsor loginToken
router.post('/login', loginSponsor)

// Refresh Sponsor access token
router.post('/refresh-token', refreshAccessTokenSponsor)

// Logout Sponsor
router.post('/logout', logoutSponsor)

// =======================
// Protected Sponsor Routes
// =======================

// Get the event associated with
// the currently authenticated Sponsor
router.get('/my-event', protectSponsor, getMyEvent)

export default router
