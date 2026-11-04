import mongoose from 'mongoose'
import ConferenceFeedback from '../models/AppFeedback.js'
import Event from '../models/Event.js'

/*
========================================================
  Create Conference Feedback
  Event Admin
========================================================
*/
export const createConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const { title, description, status, questions } = req.body

    if (!title) {
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

    if (questions && !Array.isArray(questions)) {
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

    const feedback = await ConferenceFeedback.create({
      eventId,
      title,
      description,
      status: status || 'Draft',
      questions: questions || [],
      createdBy: req.user._id,
      updatedBy: req.user._id,
      ...(status === 'Published'
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

    return res.status(500).json({
      success: false,
      message: 'Server Error',
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

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
      status: 'Published',
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
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
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
    const { title, description, questions, status } = req.body

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

    if (title !== undefined) {
      feedback.title = title
    }

    if (description !== undefined) {
      feedback.description = description
    }

    if (questions !== undefined) {
      feedback.questions = questions
    }

    if (status !== undefined) {
      feedback.status = status

      if (status === 'Published') {
        feedback.publishedBy = req.user._id
        feedback.publishedAt = new Date()
      }
    }

    feedback.updatedBy = req.user._id

    await feedback.save()

    return res.status(200).json({
      success: true,
      message: 'Feedback form updated successfully',
      data: feedback,
    })
  } catch (error) {
    console.error('Update Conference Feedback Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
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
