import express from 'express'

import {
  createQuiz,
  getQuizzesByEvent,
  getActiveQuizzesByEvent,
  updateQuiz,
  deleteQuiz,
} from '../controllers/appQuizController.js'

import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create Quiz
router.post(
  '/event-admin/events/:eventId/quizzes',
  protect,
  authorizeRoles('eventAdmin'),
  createQuiz,
)

// Get All Quizzes
router.get('/events/:eventId/quizzes', getQuizzesByEvent)

// Get Active Quizzes
router.get('/events/:eventId/quizzes/active', getActiveQuizzesByEvent)

// Update Quiz
router.put(
  '/event-admin/quizzes/:id',
  protect,
  authorizeRoles('eventAdmin'),
  updateQuiz,
)

// Delete Quiz
router.delete(
  '/event-admin/quizzes/:id',
  protect,
  authorizeRoles('eventAdmin'),
  deleteQuiz,
)

export default router
