import Session from '../models/Session.js'
import Event from '../models/Event.js'
import SessionHall from '../models/SessionHall.js'
import SessionTrack from '../models/SessionTrack.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'
// =======================
// Validate Session Against Event
// =======================
const validateSessionDateTime = (
  sessionStartDateTime,
  sessionEndDateTime,
  event,
) => {
  // Event dates must exist
  if (!event.startDateTime || !event.endDateTime) {
    return {
      valid: false,
      message: 'Event start and end date time are required',
    }
  }

  // Session must start at or after Event start
  if (sessionStartDateTime < event.startDateTime) {
    return {
      valid: false,
      message:
        'Session start date time cannot be before the event start date time',
    }
  }

  // Session must end at or before Event end
  if (sessionEndDateTime > event.endDateTime) {
    return {
      valid: false,
      message: 'Session end date time cannot be after the event end date time',
    }
  }

  return {
    valid: true,
  }
}

// =======================
// Create Session (EventAdmin)
// =======================
export const createSession = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      sessionName,
      sessionDescription,
      startDateTime,
      endDateTime,
      sessionHallId,
      sessionTrackId,
      status,
    } = req.body

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Validate Session Hall
    // =======================
    const hall = await SessionHall.findById(sessionHallId)

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Session Hall not found',
      })
    }

    // =======================
    // Validate Session Track
    // =======================
    const track = await SessionTrack.findById(sessionTrackId)

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Session Track not found',
      })
    }

    const sessionData = {
      eventId,
      sessionName,
      sessionDescription,
      startDateTime,
      endDateTime,
      sessionHallId,
      sessionTrackId,
      status,
    }

    // =======================
    // Date Validation
    // =======================
    if (
      sessionData.startDateTime &&
      isNaN(new Date(sessionData.startDateTime).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (
      sessionData.endDateTime &&
      isNaN(new Date(sessionData.endDateTime).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    // =======================
    // Convert Dates
    // =======================
    const finalStartDateTime = new Date(sessionData.startDateTime)

    const finalEndDateTime = new Date(sessionData.endDateTime)

    // =======================
    // Validate Session Date Range
    // =======================
    if (finalEndDateTime < finalStartDateTime) {
      return res.status(400).json({
        success: false,
        message:
          'End date time must be greater than or equal to start date time',
      })
    }

    // =======================
    // Validate Session Inside Event
    // =======================
    const dateValidation = validateSessionDateTime(
      finalStartDateTime,
      finalEndDateTime,
      event,
    )

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message,
      })
    }

    // =======================
    // Create Session
    // =======================
    sessionData.startDateTime = finalStartDateTime
    sessionData.endDateTime = finalEndDateTime

    const session = await Session.create(sessionData)

    return res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    })
  } catch (error) {
    console.error('Create Session Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// =======================
// Get All Sessions
// =======================
export const getSessionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const sessions = await Session.find({
      eventId,
    })
      .populate('sessionHallId', 'sessionHallName status')
      .populate('sessionTrackId', 'sessionTrackName status')
      .sort({
        startDateTime: 1,
      })

    return res.status(200).json({
      success: true,
      message: 'Sessions fetched successfully',
      data: sessions,
    })
  } catch (error) {
    console.error('Get Sessions Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// =======================
// Get Active Sessions
// =======================
export const getActiveSessionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Pagination
    const { page, limit, skip } = getPagination(req)

    // Search
    const searchQuery = buildSearchQuery(req, ['sessionName'])

    // Final Query
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // MongoDB
    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('sessionHallId', 'sessionHallName status')
        .populate('sessionTrackId', 'sessionTrackName status')
        .sort({
          startDateTime: 1,
        })
        .skip(skip)
        .limit(limit),

      Session.countDocuments(query),
    ])

    // Pagination
    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Sessions fetched successfully',
      data: sessions,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Sessions Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}


// =======================
// Get Session By Id
// =======================
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params

    const session = await Session.findById(id)
      .populate('sessionHallId', 'sessionHallName status')
      .populate('sessionTrackId', 'sessionTrackName status')

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Session fetched successfully',
      data: session,
    })
  } catch (error) {
    console.error('Get Session Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// =======================
// Update Session
// =======================
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params

    const {
      sessionName,
      sessionDescription,
      startDateTime,
      endDateTime,
      sessionHallId,
      sessionTrackId,
      status,
    } = req.body

    // =======================
    // Find Session
    // =======================
    const session = await Session.findById(id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      })
    }

    // =======================
    // Find Event
    // =======================
    const event = await Event.findById(session.eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Validate Session Hall
    // =======================
    if (sessionHallId) {
      const hall = await SessionHall.findById(sessionHallId)

      if (!hall) {
        return res.status(404).json({
          success: false,
          message: 'Session Hall not found',
        })
      }

      session.sessionHallId = sessionHallId
    }

    // =======================
    // Validate Session Track
    // =======================
    if (sessionTrackId) {
      const track = await SessionTrack.findById(sessionTrackId)

      if (!track) {
        return res.status(404).json({
          success: false,
          message: 'Session Track not found',
        })
      }

      session.sessionTrackId = sessionTrackId
    }

    // =======================
    // Date Validation
    // =======================
    if (startDateTime && isNaN(new Date(startDateTime).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (endDateTime && isNaN(new Date(endDateTime).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    // =======================
    // Final Date Values
    // =======================
    const finalStartDateTime = startDateTime
      ? new Date(startDateTime)
      : session.startDateTime

    const finalEndDateTime = endDateTime
      ? new Date(endDateTime)
      : session.endDateTime

    // =======================
    // Validate Session Date Range
    // =======================
    if (finalEndDateTime < finalStartDateTime) {
      return res.status(400).json({
        success: false,
        message:
          'End date time must be greater than or equal to start date time',
      })
    }

    // =======================
    // Validate Session Inside Event
    // =======================
    const dateValidation = validateSessionDateTime(
      finalStartDateTime,
      finalEndDateTime,
      event,
    )

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message,
      })
    }

    // =======================
    // Update Fields
    // =======================
    if (sessionName !== undefined) {
      session.sessionName = sessionName
    }

    if (sessionDescription !== undefined) {
      session.sessionDescription = sessionDescription
    }

    session.startDateTime = finalStartDateTime
    session.endDateTime = finalEndDateTime

    if (status !== undefined) {
      session.status = status
    }

    // =======================
    // Save
    // =======================
    await session.save()

    return res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session,
    })
  } catch (error) {
    console.error('Update Session Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// =======================
// Delete Session
// =======================
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params

    const session = await Session.findById(id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      })
    }

    await session.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    })
  } catch (error) {
    console.error('Delete Session Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}
