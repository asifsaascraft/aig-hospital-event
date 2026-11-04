import express from 'express'

import {
  getLiveSessionComments,
  addLiveSessionComment,
  deleteLiveSessionComment,
} from '../controllers/appSessionCommentController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

/*
========================================================
  Public - Live Session Comments
========================================================
*/

router.get('/public/live-sessions/:sessionId/comments', getLiveSessionComments)

/*
========================================================
  User - Live Session Comments
========================================================
*/

// Get comments
router.get(
  '/live-sessions/:sessionId/comments',
  protect,
  authorizeRoles('user'),
  getLiveSessionComments,
)

// Add comment
router.post(
  '/live-sessions/:sessionId/comments',
  protect,
  authorizeRoles('user'),
  addLiveSessionComment,
)

// Delete own comment
router.delete(
  '/live-session-comments/:commentId',
  protect,
  authorizeRoles('user'),
  deleteLiveSessionComment,
)

export default router
