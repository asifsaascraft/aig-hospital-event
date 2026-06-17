import express from 'express'

import {
  importRegistrations,
  importAccompanies,
  importSponsorExcel,
  createManualBadge,
  getAllOnsiteBadges,
  updateOnsiteBadge,
  sendBulkBadgeEmails,
  sendSingleBadgeEmail,
  searchOnsiteBadges,
  printBadge,
} from '../controllers/onsiteBadgeController.js'

import { uploadSponsorExcel } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

/**
 * IMPORT REGISTRATIONS
 */

router.post('/onsite/import/registrations/:eventId', importRegistrations)

router.post('/onsite/import/accompanies/:eventId', importAccompanies)

router.post(
  '/onsite/import/sponsor-excel/:eventId',

  uploadSponsorExcel.single('file'),

  importSponsorExcel,
)

router.post(
  '/event-admin/events/:eventId/onsite/badge-profiles',
  createManualBadge,
)

router.post(
  '/event-admin/events/:eventId/onsite/send-badge-emails',
  sendBulkBadgeEmails,
)

router.post(
  '/event-admin/events/:eventId/onsite/send-single-badge-email/:badgeId',
  sendSingleBadgeEmail,
)

router.put(
  '/event-admin/events/:eventId/onsite/badges/:badgeId',
  updateOnsiteBadge,
)

router.get('/event-admin/events/:eventId/onsite/badges', getAllOnsiteBadges)

router.get('/event-admin/events/:eventId/onsite/search', searchOnsiteBadges)

router.post('/event-admin/onsite/print/:badgeId', printBadge)

export default router
