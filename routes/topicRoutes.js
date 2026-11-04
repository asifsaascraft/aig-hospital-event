import express from 'express'

import {
  createTopic,
  getTopicsByEvent,
  getActiveTopicsByEvent,
  getTopicById,
  updateTopic,
  deleteTopic,
} from '../controllers/topicController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// =======================
// EventAdmin: Create Topic
// =======================
router.post(
  '/event-admin/events/:eventId/topics',
  protect,
  authorizeRoles('eventAdmin'),
  createTopic,
)

// =======================
// Public/User: Get All Topics
// =======================
router.get('/events/:eventId/topics', getTopicsByEvent)

// =======================
// Public/User: Get Active Topics
// =======================
router.get('/events/:eventId/topics/active', getActiveTopicsByEvent)

// =======================
// Public/User: Get Topic By Id
// =======================
router.get('/topics/:id', getTopicById)

// =======================
// EventAdmin: Update Topic
// =======================
router.put(
  '/event-admin/topics/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateTopic,
)

// =======================
// EventAdmin: Delete Topic
// =======================
router.delete(
  '/event-admin/topics/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteTopic,
)

export default router
