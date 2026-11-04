import AppPoll from '../models/AppPoll.js'
import Event from '../models/Event.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'

// =======================
// Create Poll (EventAdmin Only)
// =======================
export const createPoll = async (req, res) => {
  try {
    const { eventId } = req.params
    const { pollName, pollDescription, pollLink, status } = req.body

    // Validate required fields
    if (!pollName || !pollLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Poll Name, Poll Link and Status are required',
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

    // Create Poll
    const poll = await AppPoll.create({
      eventId,
      pollName,
      pollDescription,
      pollLink,
      status,
    })

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll,
    })
  } catch (error) {
    console.error('Create Poll Error:', error)

    res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Polls
// =======================
export const getPollsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const polls = await AppPoll.find({
      eventId,
    }).sort({
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      message: 'Polls fetched successfully',
      data: polls,
    })
  } catch (error) {
    console.error('Get Polls Error:', error)

    res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Polls
// =======================
export const getActivePollsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Pagination
    const { page, limit, skip } = getPagination(req)

    // Search
    const searchQuery = buildSearchQuery(req, ['pollName'])

    // Final Query
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // MongoDB
    const [polls, total] = await Promise.all([
      AppPoll.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      AppPoll.countDocuments(query),
    ])

    // Pagination
    const pagination = buildPaginationMeta(
      total,
      page,
      limit,
    )

    return res.status(200).json({
      success: true,
      message: 'Active Polls fetched successfully',
      data: polls,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Polls Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Poll
// =======================
export const updatePoll = async (req, res) => {
  try {
    const { id } = req.params

    const { pollName, pollDescription, pollLink, status } = req.body

    const poll = await AppPoll.findById(id)

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // Required fields
    if (!pollName || !pollLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Poll Name, Poll Link and Status are required',
      })
    }

    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive',
      })
    }

    poll.pollName = pollName
    poll.pollLink = pollLink
    poll.status = status

    // Description is optional and can be cleared
    if (pollDescription !== undefined) {
      poll.pollDescription = pollDescription
    }

    await poll.save()

    res.status(200).json({
      success: true,
      message: 'Poll updated successfully',
      data: poll,
    })
  } catch (error) {
    console.error('Update Poll Error:', error)

    res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Poll
// =======================
export const deletePoll = async (req, res) => {
  try {
    const { id } = req.params

    const poll = await AppPoll.findById(id)

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    await poll.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully',
    })
  } catch (error) {
    console.error('Delete Poll Error:', error)

    res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

