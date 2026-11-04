import express from 'express'

import {
  createOrganizerMember,
  getOrganizerMembersByEvent,
  getActiveOrganizerMembersByEvent,
  getOrganizerMemberById,
  updateOrganizerMember,
  deleteOrganizerMember,
} from '../controllers/appOrganizerController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

import { uploadOrganizerMemberImage } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

// =======================
// EventAdmin: Create Organizer Member
// =======================

router.post(
  '/event-admin/events/:eventId/organizer-members',
  protect,
  authorizeRoles('eventAdmin'),
  uploadOrganizerMemberImage.single('organizerProfileImage'),
  createOrganizerMember,
)

// =======================
// Public/User: Get All Organizer Members
// =======================

router.get('/events/:eventId/organizer-members', getOrganizerMembersByEvent)

// =======================
// Public/User: Get Active Organizer Members
// =======================

router.get(
  '/events/:eventId/organizer-members/active',
  getActiveOrganizerMembersByEvent,
)

// =======================
// Public/User: Get Organizer Member By Id
// =======================

router.get('/organizer-members/:id', getOrganizerMemberById)

// =======================
// EventAdmin: Update Organizer Member
// =======================

router.put(
  '/event-admin/organizer-members/:id',
  protect,
  authorizeRoles('eventAdmin'),
  uploadOrganizerMemberImage.single('organizerProfileImage'),
  updateOrganizerMember,
)

// =======================
// EventAdmin: Delete Organizer Member
// =======================

router.delete(
  '/event-admin/organizer-members/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteOrganizerMember,
)

export default router
