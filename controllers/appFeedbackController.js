
import mongoose from 'mongoose'
import ConferenceFeedback from '../models/AppFeedback.js'
import Event from '../models/Event.js'

/*
========================================================
  Date/Time Helpers
========================================================
*/

const isValidDateTime = (value) =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  !Number.isNaN(new Date(value).getTime())

const validateFeedbackDateRange = (startDateTime, endDateTime) => {
  if (endDateTime <= startDateTime) {
    throw new Error('End date/time must be later than start date/time')
  }
}

/*
========================================================
  Create Conference Feedback
  Event Admin
========================================================
*/
export const createConferenceFeedback = async (req, res) => {
  
  try {
    const { eventId } = req.params
    const {
      title,
      description,
      status,
      questions,
      startDateTime,
      endDateTime,
    } = req.body


    

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback title is required',
      })
    }

    if (status && !['Draft', 'Published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Draft or Published',
      })
    }

    if (questions !== undefined && !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Questions must be an array',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    // Both dates are mandatory when creating feedback.
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start and End date time are required',
      })
    }

    // Validate date formats.
    if (!isValidDateTime(startDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (!isValidDateTime(endDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    // Convert incoming values to JavaScript Date objects.
    const parsedStartDateTime = new Date(startDateTime)
    const parsedEndDateTime = new Date(endDateTime)

    validateFeedbackDateRange(parsedStartDateTime, parsedEndDateTime)

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const existingFeedback = await ConferenceFeedback.findOne({
      eventId,
    })

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback form already exists for this event',
      })
    }

    const feedbackStatus = status || 'Draft'

    const feedback = await ConferenceFeedback.create({
      eventId,
      title,
      description,
      status: feedbackStatus,
      questions: questions || [],
      startDateTime: parsedStartDateTime,
      endDateTime: parsedEndDateTime,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      ...(feedbackStatus === 'Published'
        ? {
            publishedBy: req.user._id,
            publishedAt: new Date(),
          }
        : {}),
    })

    return res.status(201).json({
      success: true,
      message: 'Feedback form created successfully',
      data: feedback,
    })
  } catch (error) {
    console.error('Create Conference Feedback Error:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Feedback form already exists for this event',
      })
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create feedback form',
    })
  }
}

/*
========================================================
  Get Conference Feedback
  Event Admin
========================================================
*/
export const getConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('publishedBy', 'name email')

    if (!feedback) {
      return res.status(200).json({
        success: true,
        message: 'Feedback form not found',
        data: null,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback form fetched successfully',
      data: feedback,
    })
  } catch (error) {
    console.error('Get Conference Feedback Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

/*
========================================================
  Get Conference Feedback For User
  Logged-in User

  Available only when:
  1. Status is Published
  2. Current server time >= startDateTime
  3. Current server time <= endDateTime
========================================================
*/
export const getConferenceFeedbackForUser = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await Event.findById(eventId).lean()

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Always use backend server time.
    // JavaScript Date represents an absolute timestamp.
    const now = new Date()

    const feedback = await ConferenceFeedback.findOne({
      eventId,
      status: 'Published',
      startDateTime: { $lte: now },
      endDateTime: { $gte: now },
    }).lean()

    if (!feedback) {
      return res.status(200).json({
        success: true,
        message: 'Feedback form not available',
        data: null,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback form fetched successfully',
      data: {
        ...feedback,
        eventName: event.eventName,
        dynamicStatus: event.dynamicStatus,
      },
    })
  } catch (error) {
    console.error(
      'Get Conference Feedback For User Error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

/*
========================================================
  Update Conference Feedback
  Event Admin
========================================================
*/
export const updateConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const {
      title,
      description,
      questions,
      status,
      startDateTime,
      endDateTime,
    } = req.body

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    if (status && !['Draft', 'Published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Draft or Published',
      })
    }

    if (questions !== undefined && !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Questions must be an array',
      })
    }

    if (title !== undefined && (
      typeof title !== 'string' || !title.trim()
    )) {
      return res.status(400).json({
        success: false,
        message: 'Feedback title is required',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback form not found',
      })
    }

    /*
    ----------------------------------------------------
      Published feedback is locked.
      This prevents historical responses from becoming
      inconsistent with the published questions.
    ----------------------------------------------------
    */
    if (feedback.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Published feedback form cannot be modified',
      })
    }

    // Preserve existing dates when only one date is updated.
    if (startDateTime !== undefined && !isValidDateTime(startDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDateTime format',
      })
    }

    if (endDateTime !== undefined && !isValidDateTime(endDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDateTime format',
      })
    }

    const finalStartDateTime =
      startDateTime !== undefined
        ? new Date(startDateTime)
        : feedback.startDateTime

    const finalEndDateTime =
      endDateTime !== undefined
        ? new Date(endDateTime)
        : feedback.endDateTime

    if (!finalStartDateTime || !finalEndDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start and End date time are required',
      })
    }

    validateFeedbackDateRange(finalStartDateTime, finalEndDateTime)

    if (title !== undefined) {
      feedback.title = title.trim()
    }

    if (description !== undefined) {
      feedback.description = description
    }

    if (questions !== undefined) {
      feedback.questions = questions
    }

    feedback.startDateTime = finalStartDateTime
    feedback.endDateTime = finalEndDateTime

    if (status !== undefined) {
      feedback.status = status

      if (status === 'Published') {
        feedback.publishedBy = req.user._id
        feedback.publishedAt = new Date()
      }
    }

    feedback.updatedBy = req.user._id

    // save() runs document and embedded-question validation.
    await feedback.save()

    return res.status(200).json({
      success: true,
      message: 'Feedback form updated successfully',
      data: feedback,
    })
  } catch (error) {
    console.error('Update Conference Feedback Error:', error)

    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to update feedback form',
    })
  }
}

/*
========================================================
  Delete Conference Feedback
  Event Admin
========================================================
*/
export const deleteConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback form not found',
      })
    }

    if (feedback.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Published feedback form cannot be deleted',
      })
    }

    await ConferenceFeedback.deleteOne({
      _id: feedback._id,
    })

    return res.status(200).json({
      success: true,
      message: 'Feedback form deleted successfully',
    })
  } catch (error) {
    console.error('Delete Conference Feedback Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
