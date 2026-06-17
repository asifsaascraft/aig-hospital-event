import express from 'express'

import {
  createPrivilege,
  bulkAssignPrivileges,
  getPrivilegesByBadgeProfile,
  getPrivilegeMatrix,
  updatePrivilege,
  deletePrivilege,
} from '../controllers/badgeProfilePrivilegeController.js'

const router = express.Router()

//======================================================
// CREATE PRIVILEGE
//======================================================

router.post('/event-admin/events/:eventId/privileges', createPrivilege)

//======================================================
// BULK ASSIGN PRIVILEGES
//======================================================

router.post(
  '/event-admin/events/:eventId/privileges/bulk',
  bulkAssignPrivileges,
)

//======================================================
// GET MATRIX
//======================================================

router.get('/event-admin/events/:eventId/privileges', getPrivilegeMatrix)

//======================================================
// GET BY BADGE PROFILE
//======================================================

router.get(
  '/event-admin/events/:eventId/privileges/:badgeProfileId',
  getPrivilegesByBadgeProfile,
)

//======================================================
// UPDATE
//======================================================

router.put('/event-admin/privileges/:id', updatePrivilege)

//======================================================
// DELETE
//======================================================

router.delete('/event-admin/privileges/:id', deletePrivilege)

export default router
