import mongoose from 'mongoose'

import Event from '../models/Event.js'
import LiveSession from '../models/AppSession.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'
/*
========================================================
  Create Live Session
  Event Admin
========================================================
*/
export const createLiveSession = async (req, res) => {
  try {
    const { eventId } = req.params
    const eventAdminId = req.user._id

    const { sessionTitle, streamingLink, startDateTime, endDateTime, status } =
      req.body

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    // Validate event
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Validate required fields
    if (!sessionTitle?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Session title is required',
      })
    }

    if (!streamingLink?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Streaming link is required',
      })
    }

    if (!startDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start date and time is required',
      })
    }

    if (!endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'End date and time is required',
      })
    }

    const start = new Date(startDateTime)
    const end = new Date(endDateTime)

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date and time',
      })
    }

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date and time',
      })
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date and time must be after start date and time',
      })
    }

    // Validate status
    if (status && !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Active or Inactive',
      })
    }

    const liveSession = await LiveSession.create({
      eventId,
      sessionTitle: sessionTitle.trim(),
      streamingLink: streamingLink.trim(),
      startDateTime: start,
      endDateTime: end,
      status: status || 'Active',
      createdBy: eventAdminId,
      updatedBy: eventAdminId,
    })

    return res.status(201).json({
      success: true,
      message: 'Live session created successfully',
      data: liveSession,
    })
  } catch (error) {
    console.error('Create live session error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to create live session',
    })
  }
}

/*
========================================================
  Get All Live Sessions For Event
  Event Admin
========================================================
*/
export const getLiveSessionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    // Validate event
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const liveSessions = await LiveSession.find({ eventId })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ startDateTime: 1 })

    return res.status(200).json({
      success: true,
      message: 'Live sessions fetched successfully',
      data: liveSessions,
    })
  } catch (error) {
    console.error('Get live sessions error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live sessions',
    })
  }
}

/*
========================================================
  Get Active Live Sessions For User
========================================================
*/
export const getActiveLiveSessionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    // Validate event
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Pagination
    const { page, limit, skip } = getPagination(req)

    // Search by sessionTitle
    const searchQuery = buildSearchQuery(req, ['sessionTitle'])

    // Final Query
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // MongoDB
    const [liveSessions, total] = await Promise.all([
      LiveSession.find(query)
        .sort({
          startDateTime: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      LiveSession.countDocuments(query),
    ])

    // Pagination
    const pagination = buildPaginationMeta(
      total,
      page,
      limit,
    )

    return res.status(200).json({
      success: true,
      message: 'Active live sessions fetched successfully',
      data: liveSessions,
      pagination,
    })
  } catch (error) {
    console.error('Get active live sessions error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active live sessions',
    })
  }
}


/*
========================================================
  Get Active Live Session By ID
  User - Live Session Details
========================================================
*/
export const getActiveLiveSessionById = async (req, res) => {
  try {
    const { id } = req.params

    // Validate live session ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    // Fetch only active sessions
    const liveSession = await LiveSession.findOne({
      _id: id,
      status: 'Active',
    }).lean()

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Active live session not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Live session fetched successfully',
      data: liveSession,
    })
  } catch (error) {
    console.error('Get active live session by ID error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live session',
    })
  }
}


/*
========================================================
  Update Live Session
  Event Admin
========================================================
*/
export const updateLiveSession = async (req, res) => {
  try {
    const { id } = req.params
    const eventAdminId = req.user._id

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    const liveSession = await LiveSession.findById(id)

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found',
      })
    }

    const { sessionTitle, streamingLink, startDateTime, endDateTime, status } =
      req.body

    if (sessionTitle !== undefined) {
      if (!sessionTitle.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Session title is required',
        })
      }

      liveSession.sessionTitle = sessionTitle.trim()
    }

    if (streamingLink !== undefined) {
      if (!streamingLink.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Streaming link is required',
        })
      }

      liveSession.streamingLink = streamingLink.trim()
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be Active or Inactive',
        })
      }

      liveSession.status = status
    }

    let start = liveSession.startDateTime
    let end = liveSession.endDateTime

    if (startDateTime !== undefined) {
      start = new Date(startDateTime)

      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date and time',
        })
      }

      liveSession.startDateTime = start
    }

    if (endDateTime !== undefined) {
      end = new Date(endDateTime)

      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date and time',
        })
      }

      liveSession.endDateTime = end
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date and time must be after start date and time',
      })
    }

    liveSession.updatedBy = eventAdminId

    await liveSession.save()

    return res.status(200).json({
      success: true,
      message: 'Live session updated successfully',
      data: liveSession,
    })
  } catch (error) {
    console.error('Update live session error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update live session',
    })
  }
}

/*
========================================================
  Delete Live Session
  Event Admin
========================================================
*/
export const deleteLiveSession = async (req, res) => {
  try {
    const { id } = req.params

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    const liveSession = await LiveSession.findById(id)

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found',
      })
    }

    await LiveSession.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'Live session deleted successfully',
    })
  } catch (error) {
    console.error('Delete live session error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to delete live session',
    })
  }
}
