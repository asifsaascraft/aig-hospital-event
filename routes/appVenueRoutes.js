import express from 'express'

import {
  createVenue,
  getVenuesByEvent,
  getActiveVenuesByEvent,
  updateVenue,
  deleteVenue,
} from '../controllers/appVenueController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// =======================
// EventAdmin: Create Venue
// =======================
router.post(
  '/event-admin/events/:eventId/venues',
  protect,
  authorizeRoles('eventAdmin'),
  createVenue,
)

// =======================
// Public/User: Get All Venues
// =======================
router.get('/events/:eventId/venues', getVenuesByEvent)

// =======================
// Public/User: Get Active Venues
// =======================
router.get('/events/:eventId/venues/active', getActiveVenuesByEvent)

// =======================
// EventAdmin: Update Venue
// =======================
router.put(
  '/event-admin/venues/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateVenue,
)

// =======================
// EventAdmin: Delete Venue
// =======================
router.delete(
  '/event-admin/venues/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteVenue,
)

export default router
