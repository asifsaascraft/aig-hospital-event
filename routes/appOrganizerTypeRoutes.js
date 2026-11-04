import express from 'express'

import {
  createOrganizerType,
  getOrganizerTypesByEvent,
  getActiveOrganizerTypesByEvent,
  updateOrganizerType,
  deleteOrganizerType,
} from '../controllers/appOrganizerTypeController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// =======================
// EventAdmin: Create Organizer Type
// =======================
router.post(
  '/event-admin/events/:eventId/organizer-types',
  protect,
  authorizeRoles('eventAdmin'),
  createOrganizerType,
)

// =======================
// Public/User: Get All Organizer Types
// =======================
router.get('/events/:eventId/organizer-types', getOrganizerTypesByEvent)

// =======================
// Public/User: Get Active Organizer Types
// =======================
router.get(
  '/events/:eventId/organizer-types/active',
  getActiveOrganizerTypesByEvent,
)

// =======================
// EventAdmin: Update Organizer Type
// =======================
router.put(
  '/event-admin/organizer-types/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateOrganizerType,
)

// =======================
// EventAdmin: Delete Organizer Type
// =======================
router.delete(
  '/event-admin/organizer-types/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteOrganizerType,
)

export default router
