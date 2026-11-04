import mongoose from 'mongoose'

import Topic from '../models/Topic.js'
import Event from '../models/Event.js'
import Session from '../models/Session.js'
import Speaker from '../models/Speaker.js'

import { getPagination, buildPaginationMeta } from '../utils/pagination.js'

import buildSearchQuery from '../utils/search.js'

// =======================
// Allowed Topic Types
// =======================

const TOPIC_TYPES = ['Presentation', 'Panel Discussion', 'Quiz', 'Debate']

// =======================
// Participant Roles
// =======================

const PARTICIPANT_ROLES = [
  'Speaker',
  'Chairperson',
  'Co-Chairperson',
  'Moderator',
  'Panelist',
  'Quiz Master',
  'Team Member',
]

// =======================
// Validate ObjectId
// =======================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value)
}

// =======================
// Validate Topic Type
// =======================

const validateTopicType = (topicType) => {
  if (!TOPIC_TYPES.includes(topicType)) {
    return `Invalid topic type. Allowed topic types: ${TOPIC_TYPES.join(', ')}`
  }

  return null
}

// =======================
// Validate Participant Rules
// =======================

const validateParticipantRules = (topicType, participants = []) => {
  if (!Array.isArray(participants)) {
    return 'Participants must be an array'
  }

  // =======================
  // Validate Every Participant
  // =======================

  for (const participant of participants) {
    if (!participant?.speakerId) {
      return 'Speaker is required for every participant'
    }

    if (!participant?.role) {
      return 'Participant role is required'
    }

    if (!PARTICIPANT_ROLES.includes(participant.role)) {
      return `Invalid participant role: ${participant.role}`
    }

    if (!isValidObjectId(participant.speakerId)) {
      return `Invalid speaker ID: ${participant.speakerId}`
    }
  }

  // =======================
  // Role Helpers
  // =======================

  const getRoleCount = (role) => {
    return participants.filter((participant) => participant.role === role)
      .length
  }

  const hasRole = (role) => getRoleCount(role) > 0

  const hasOnlyAllowedRoles = (allowedRoles) => {
    return participants.every((participant) =>
      allowedRoles.includes(participant.role),
    )
  }

  // =======================
  // Presentation
  // =======================
  //
  // Required:
  // Exactly 1 Speaker
  //
  // Optional:
  // Chairperson
  // Co-Chairperson
  //
  // Multiple Chairpersons and
  // Co-Chairpersons are allowed.
  // =======================

  if (topicType === 'Presentation') {
    const speakerCount = getRoleCount('Speaker')

    if (speakerCount !== 1) {
      return 'Exactly one Speaker is required for Presentation'
    }

    if (!hasOnlyAllowedRoles(['Speaker', 'Chairperson', 'Co-Chairperson'])) {
      return 'Presentation only allows Speaker, Chairperson, or Co-Chairperson'
    }
  }

  // =======================
  // Panel Discussion
  // =======================
  //
  // Required:
  // At least 1 Moderator
  // At least 1 Panelist
  //
  // Multiple Moderators allowed.
  // Multiple Panelists allowed.
  // =======================

  if (topicType === 'Panel Discussion') {
    const moderatorCount = getRoleCount('Moderator')
    const panelistCount = getRoleCount('Panelist')

    if (moderatorCount < 1) {
      return 'At least one Moderator is required for Panel Discussion'
    }

    if (panelistCount < 1) {
      return 'At least one Panelist is required for Panel Discussion'
    }

    if (!hasOnlyAllowedRoles(['Moderator', 'Panelist'])) {
      return 'Panel Discussion only allows Moderator and Panelist'
    }
  }

  // =======================
  // Quiz
  // =======================
  //
  // Required:
  // At least 1 Quiz Master
  // At least 1 Team Member
  //
  // Multiple Quiz Masters allowed.
  // Multiple Team Members allowed.
  // =======================

  if (topicType === 'Quiz') {
    const quizMasterCount = getRoleCount('Quiz Master')
    const teamMemberCount = getRoleCount('Team Member')

    if (quizMasterCount < 1) {
      return 'At least one Quiz Master is required for Quiz'
    }

    if (teamMemberCount < 1) {
      return 'At least one Team Member is required for Quiz'
    }

    if (!hasOnlyAllowedRoles(['Quiz Master', 'Team Member'])) {
      return 'Quiz only allows Quiz Master and Team Member'
    }
  }

  // =======================
  // Debate
  // =======================
  //
  // Required:
  // At least 1 Moderator
  // At least 1 Speaker
  //
  // Multiple Moderators allowed.
  // Multiple Speakers allowed.
  // =======================

  if (topicType === 'Debate') {
    const moderatorCount = getRoleCount('Moderator')
    const speakerCount = getRoleCount('Speaker')

    if (moderatorCount < 1) {
      return 'At least one Moderator is required for Debate'
    }

    if (speakerCount < 1) {
      return 'At least one Speaker is required for Debate'
    }

    if (!hasOnlyAllowedRoles(['Moderator', 'Speaker'])) {
      return 'Debate only allows Moderator and Speaker'
    }
  }

  return null
}

// =======================
// Validate Speakers
// =======================

const validateSpeakers = async (participants, eventId) => {
  if (!participants?.length) {
    return null
  }

  const speakerIds = participants.map((participant) => participant.speakerId)

  const uniqueSpeakerIds = [...new Set(speakerIds.map(String))]

  const speakers = await Speaker.find({
    _id: {
      $in: uniqueSpeakerIds,
    },
    eventId,
  }).select('_id')

  if (speakers.length !== uniqueSpeakerIds.length) {
    return 'One or more selected speakers are invalid or do not belong to this event'
  }

  return null
}

// =======================
// Validate Topic Time
// =======================

const validateTopicTime = async ({
  session,
  startDateTime,
  endDateTime,
  topicId = null,
}) => {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  // =======================
  // Date Format
  // =======================

  if (isNaN(start.getTime())) {
    return 'Invalid startDateTime format'
  }

  if (isNaN(end.getTime())) {
    return 'Invalid endDateTime format'
  }

  // =======================
  // End >= Start
  // =======================

  if (end < start) {
    return 'End date time must be greater than or equal to start date time'
  }

  // =======================
  // Session Boundary
  // =======================

  if (start < session.startDateTime) {
    return 'Topic start date time cannot be before the session start date time'
  }

  if (end > session.endDateTime) {
    return 'Topic end date time cannot be after the session end date time'
  }

  // =======================
  // Topic Overlap
  // =======================

  const overlapQuery = {
    sessionId: session._id,

    startDateTime: {
      $lt: end,
    },

    endDateTime: {
      $gt: start,
    },
  }

  if (topicId) {
    overlapQuery._id = {
      $ne: topicId,
    }
  }

  const overlappingTopic = await Topic.findOne(overlapQuery).select(
    '_id title startDateTime endDateTime',
  )

  if (overlappingTopic) {
    return `Topic time overlaps with "${overlappingTopic.title}"`
  }

  return null
}

// =======================
// Create Topic
// =======================

export const createTopic = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      sessionId,
      topicType,
      title,
      aboutTopic,
      startDateTime,
      endDateTime,
      participants = [],
      featured,
      featuredOrder,
      status,
    } = req.body

    // =======================
    // Validate Event ID
    // =======================

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    // =======================
    // Basic Validation
    // =======================

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session is required',
      })
    }

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      })
    }

    if (!topicType) {
      return res.status(400).json({
        success: false,
        message: 'Topic Type is required',
      })
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      })
    }

    if (!startDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start date time is required',
      })
    }

    if (!endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'End date time is required',
      })
    }

    // =======================
    // Validate Topic Type
    // =======================

    const topicTypeError = validateTopicType(topicType)

    if (topicTypeError) {
      return res.status(400).json({
        success: false,
        message: topicTypeError,
      })
    }

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
    // Validate Session
    // =======================

    const session = await Session.findOne({
      _id: sessionId,
      eventId,
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or session does not belong to this event',
      })
    }

    // =======================
    // Date Validation
    // =======================

    const finalStartDateTime = new Date(startDateTime)
    const finalEndDateTime = new Date(endDateTime)

    if (isNaN(finalStartDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (isNaN(finalEndDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    // =======================
    // Validate Topic Time
    // =======================

    const timeError = await validateTopicTime({
      session,
      startDateTime: finalStartDateTime,
      endDateTime: finalEndDateTime,
    })

    if (timeError) {
      return res.status(400).json({
        success: false,
        message: timeError,
      })
    }

    // =======================
    // Validate Participants
    // =======================

    const participantError = validateParticipantRules(topicType, participants)

    if (participantError) {
      return res.status(400).json({
        success: false,
        message: participantError,
      })
    }

    // =======================
    // Validate Speakers
    // =======================

    const speakerError = await validateSpeakers(participants, eventId)

    if (speakerError) {
      return res.status(400).json({
        success: false,
        message: speakerError,
      })
    }

    // =======================
    // Create Topic
    // =======================

    const topic = await Topic.create({
      eventId,
      sessionId,
      topicType,
      title: title.trim(),
      aboutTopic: aboutTopic !== undefined ? aboutTopic.trim() : '',
      startDateTime: finalStartDateTime,
      endDateTime: finalEndDateTime,
      participants,
      featured: featured !== undefined ? featured : false,
      featuredOrder:
        featured === true && featuredOrder !== undefined ? featuredOrder : null,
      status: status || 'Active',
    })

    // =======================
    // Populate Response
    // =======================

    const populatedTopic = await Topic.findById(topic._id)
      .populate('sessionId', 'sessionName startDateTime endDateTime status')
      .populate('participants.speakerId', 'name designation affiliation status')

    return res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: populatedTopic,
    })
  } catch (error) {
    console.error('Create Topic Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      })
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
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
// Get All Topics By Event
// =======================

export const getTopicsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Validate Event ID
    // =======================

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

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
    // Get Topics
    // =======================

    const topics = await Topic.find({
      eventId,
    })
      .populate({
        path: 'sessionId',
        select:
          'sessionName startDateTime endDateTime status sessionHallId sessionTrackId',
        populate: [
          {
            path: 'sessionHallId',
          },
          {
            path: 'sessionTrackId',
          },
        ],
      })

      .populate('participants.speakerId', 'name designation affiliation status')
      .sort({
        startDateTime: 1,
      })

    return res.status(200).json({
      success: true,
      message: 'Topics fetched successfully',
      data: topics,
    })
  } catch (error) {
    console.error('Get Topics Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}


// =======================
// Get Active Topics By Event Old
// =======================

export const getActiveTopicsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params
    const { sessionId, speakerId } = req.query

    // =======================
    // Validate Event ID
    // =======================

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

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
    // Validate Session ID
    // =======================

    if (sessionId && !isValidObjectId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      })
    }

    // =======================
    // Validate Session Belongs
    // To This Event
    // =======================

    if (sessionId) {
      const session = await Session.findOne({
        _id: sessionId,
        eventId,
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or session does not belong to this event',
        })
      }
    }

    // =======================
    // Validate Speaker ID
    // =======================

    if (speakerId && !isValidObjectId(speakerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid speaker ID',
      })
    }

    // =======================
    // Pagination
    // =======================

    const { page, limit, skip } = getPagination(req)

    // =======================
    // Search
    // =======================

    const searchQuery = buildSearchQuery(req, ['title'])

    // =======================
    // Final Query
    // =======================

    const query = {
      eventId,
      status: 'Active',
      ...(sessionId && { sessionId }),
      ...(speakerId && { 'participants.speakerId': speakerId }),
      ...searchQuery,
    }

    // =======================
    // MongoDB
    // =======================

    const [topics, total] = await Promise.all([
      Topic.find(query)
        .populate('sessionId', '_id')
        .populate(
          'participants.speakerId',
          'name designation affiliation status',
        )
        .sort({
          featured: -1,
          featuredOrder: 1,
          startDateTime: 1,
        })
        .skip(skip)
        .limit(limit),

      Topic.countDocuments(query),
    ])

    // =======================
    // Pagination
    // =======================

    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Topics fetched successfully',
      data: topics,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Topics Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}


// =======================
// Get Topic By Id
// =======================

export const getTopicById = async (req, res) => {
  try {
    const { id } = req.params

    // =======================
    // Validate ID
    // =======================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topic ID',
      })
    }

    // =======================
    // Get Topic
    // =======================

    const topic = await Topic.findById(id)
      .populate({
        path: 'sessionId',
        select:
          'sessionName startDateTime endDateTime status sessionHallId sessionTrackId',
        populate: [
          {
            path: 'sessionHallId',
          },
          {
            path: 'sessionTrackId',
          },
        ],
      })

      .populate('participants.speakerId', 'name designation affiliation status')

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Topic fetched successfully',
      data: topic,
    })
  } catch (error) {
    console.error('Get Topic Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// =======================
// Update Topic
// =======================

export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params

    // =======================
    // Validate Topic ID
    // =======================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topic ID',
      })
    }

    const {
      sessionId,
      topicType,
      title,
      aboutTopic,
      startDateTime,
      endDateTime,
      participants,
      featured,
      featuredOrder,
      status,
    } = req.body

    // =======================
    // Find Topic
    // =======================

    const topic = await Topic.findById(id)

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      })
    }

    // =======================
    // Determine Final Values
    // =======================

    const finalSessionId = sessionId || topic.sessionId

    const finalTopicType = topicType || topic.topicType

    const finalTitle = title !== undefined ? title : topic.title

    const finalAboutTopic =
      aboutTopic !== undefined ? aboutTopic : topic.aboutTopic

    const finalStartDateTime =
      startDateTime !== undefined
        ? new Date(startDateTime)
        : topic.startDateTime

    const finalEndDateTime =
      endDateTime !== undefined ? new Date(endDateTime) : topic.endDateTime

    const finalParticipants =
      participants !== undefined ? participants : topic.participants

    // =======================
    // Validate Session ID
    // =======================

    if (!finalSessionId || !isValidObjectId(finalSessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      })
    }

    // =======================
    // Validate Topic Type
    // =======================

    const topicTypeError = validateTopicType(finalTopicType)

    if (topicTypeError) {
      return res.status(400).json({
        success: false,
        message: topicTypeError,
      })
    }

    // =======================
    // Validate Title
    // =======================

    if (!finalTitle || !finalTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      })
    }

    // =======================
    // Validate Event
    // =======================

    const event = await Event.findById(topic.eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Validate Session
    // =======================

    const session = await Session.findOne({
      _id: finalSessionId,
      eventId: topic.eventId,
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or session does not belong to this event',
      })
    }

    // =======================
    // Date Validation
    // =======================

    if (isNaN(finalStartDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (isNaN(finalEndDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    // =======================
    // Validate Topic Time
    // =======================

    const timeError = await validateTopicTime({
      session,
      startDateTime: finalStartDateTime,
      endDateTime: finalEndDateTime,
      topicId: topic._id,
    })

    if (timeError) {
      return res.status(400).json({
        success: false,
        message: timeError,
      })
    }

    // =======================
    // Validate Participants
    // =======================

    const participantError = validateParticipantRules(
      finalTopicType,
      finalParticipants,
    )

    if (participantError) {
      return res.status(400).json({
        success: false,
        message: participantError,
      })
    }

    // =======================
    // Validate Speakers
    // =======================

    const speakerError = await validateSpeakers(
      finalParticipants,
      topic.eventId,
    )

    if (speakerError) {
      return res.status(400).json({
        success: false,
        message: speakerError,
      })
    }

    // =======================
    // Update Fields
    // =======================

    topic.sessionId = finalSessionId

    topic.topicType = finalTopicType

    topic.title = finalTitle.trim()

    topic.aboutTopic =
      finalAboutTopic !== undefined && finalAboutTopic !== null
        ? String(finalAboutTopic).trim()
        : ''

    topic.startDateTime = finalStartDateTime

    topic.endDateTime = finalEndDateTime

    topic.participants = finalParticipants

    if (featured !== undefined) {
      topic.featured = featured

      if (!featured) {
        topic.featuredOrder = null
      } else if (featuredOrder !== undefined) {
        topic.featuredOrder = featuredOrder
      }
    } else if (featuredOrder !== undefined) {
      topic.featuredOrder = featuredOrder
    }

    if (status !== undefined) {
      topic.status = status
    }

    // =======================
    // Save
    // =======================

    await topic.save()

    // =======================
    // Populate Response
    // =======================

    const populatedTopic = await Topic.findById(topic._id)
      .populate('sessionId', 'sessionName startDateTime endDateTime status')
      .populate('participants.speakerId', 'name designation affiliation status')

    return res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      data: populatedTopic,
    })
  } catch (error) {
    console.error('Update Topic Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      })
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
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
// Delete Topic
// =======================

export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params

    // =======================
    // Validate Topic ID
    // =======================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topic ID',
      })
    }

    // =======================
    // Find Topic
    // =======================

    const topic = await Topic.findById(id)

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      })
    }

    // =======================
    // Delete
    // =======================

    await topic.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    })
  } catch (error) {
    console.error('Delete Topic Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}
