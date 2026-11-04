import AppQuiz from '../models/AppQuiz.js'
import Event from '../models/Event.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'

// =======================
// Create Quiz (EventAdmin Only)
// =======================
export const createQuiz = async (req, res) => {
  try {
    const { eventId } = req.params
    const { quizName, quizDescription, quizLink, status } = req.body

    // Validate required fields
    if (!quizName || !quizLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Quiz Name, Quiz Link and Status are required',
      })
    }

    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive',
      })
    }

    // Validate event existence
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Create Quiz
    const quiz = await AppQuiz.create({
      eventId,
      quizName,
      quizDescription,
      quizLink,
      status,
    })

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    })
  } catch (error) {
    console.error('Create Quiz Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Quizzes
// =======================
export const getQuizzesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const quizzes = await AppQuiz.find({
      eventId,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      message: 'Quizzes fetched successfully',
      data: quizzes,
    })
  } catch (error) {
    console.error('Get Quizzes Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Quizzes
// =======================
export const getActiveQuizzesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Pagination
    const { page, limit, skip } = getPagination(req)

    // Search by quizName
    const searchQuery = buildSearchQuery(req, ['quizName'])

    // Final Query
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // MongoDB
    const [quizzes, total] = await Promise.all([
      AppQuiz.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      AppQuiz.countDocuments(query),
    ])

    // Pagination
    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Quizzes fetched successfully',
      data: quizzes,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Quizzes Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Quiz
// =======================
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params

    const { quizName, quizDescription, quizLink, status } = req.body

    const quiz = await AppQuiz.findById(id)

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      })
    }

    // Required fields
    if (!quizName || !quizLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Quiz Name, Quiz Link and Status are required',
      })
    }

    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive',
      })
    }

    quiz.quizName = quizName
    quiz.quizLink = quizLink
    quiz.status = status

    // Description is optional and can be cleared
    if (quizDescription !== undefined) {
      quiz.quizDescription = quizDescription
    }

    await quiz.save()

    return res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz,
    })
  } catch (error) {
    console.error('Update Quiz Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Quiz
// =======================
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params

    const quiz = await AppQuiz.findById(id)

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      })
    }

    await quiz.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    })
  } catch (error) {
    console.error('Delete Quiz Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
