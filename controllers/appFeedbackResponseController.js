import mongoose from 'mongoose'
import ConferenceFeedback from '../models/AppFeedback.js'
import ConferenceFeedbackResponse from '../models/AppFeedbackResponse.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'

/*
========================================================
  Submit Conference Feedback
  Logged-in User
========================================================
*/
export const submitConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const { answers } = req.body
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array',
      })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    /*
    ----------------------------------------------------
      Feedback becomes available immediately after the
      event ends.
    ----------------------------------------------------
    */
    if (!event.endDateTime || new Date() <= new Date(event.endDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is available after the conference ends',
      })
    }

    /*
    ----------------------------------------------------
      User must have a paid, non-suspended registration.
    ----------------------------------------------------
    */
    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      isPaid: true,
      isSuspended: false,
    })

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to submit feedback for this event',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
      status: 'Published',
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback form not available',
      })
    }

    /*
    ----------------------------------------------------
      Prevent duplicate submission.
    ----------------------------------------------------
    */
    const existingResponse = await ConferenceFeedbackResponse.findOne({
      eventId,
      userId,
    })

    if (existingResponse) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted',
      })
    }

    /*
    ----------------------------------------------------
      Validate answers against published questions.
    ----------------------------------------------------
    */
    const submittedAnswerMap = new Map(
      answers.map((answer) => [answer.id, answer]),
    )

    const finalAnswers = []

    for (const question of feedback.questions) {
      const answer = submittedAnswerMap.get(question.id)

      if (question.required) {
        const hasValue =
          answer &&
          answer.value !== undefined &&
          answer.value !== null &&
          answer.value !== '' &&
          (!Array.isArray(answer.value) || answer.value.length > 0)

        if (!hasValue) {
          return res.status(400).json({
            success: false,
            message: `Answer is required for: ${question.label}`,
          })
        }
      }

      if (!answer) {
        continue
      }

      finalAnswers.push({
        id: question.id,
        label: question.label,
        type: question.type,
        required: question.required,
        value: answer.value,
        options: question.options,
        minValue: question.minValue,
        maxValue: question.maxValue,
      })
    }

    const response = await ConferenceFeedbackResponse.create({
      eventId,
      feedbackId: feedback._id,
      userId,
      answers: finalAnswers,
      submittedAt: new Date(),
    })

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: response,
    })
  } catch (error) {
    console.error('Submit Conference Feedback Error:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted',
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
  Get My Feedback Status
  Logged-in User
========================================================
*/
export const getMyConferenceFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.user._id

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

    if (!event.endDateTime || new Date() <= new Date(event.endDateTime)) {
      return res.status(403).json({
        success: false,
        message: 'Feedback is available after the conference ends',
      })
    }

    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      isPaid: true,
      isSuspended: false,
    })

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to submit feedback',
      })
    }

    const feedback = await ConferenceFeedback.findOne({
      eventId,
      status: 'Published',
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback form not available',
      })
    }

    const response = await ConferenceFeedbackResponse.findOne({
      eventId,
      userId,
    })

    if (response) {
      return res.status(200).json({
        success: true,
        submitted: true,
        message: 'Feedback Submitted Successfully',
      })
    }

    return res.status(200).json({
      success: true,
      submitted: false,
      message: 'Feedback form available',
      data: feedback,
    })
  } catch (error) {
    console.error('Get My Conference Feedback Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

/*
========================================================
  Get Feedback Responses
  Event Admin
========================================================
*/
export const getConferenceFeedbackResponses = async (req, res) => {
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

    const responses = await ConferenceFeedbackResponse.find({
      eventId,
    })
      .populate('userId', 'name email mobile')
      .sort({ submittedAt: -1 })

    return res.status(200).json({
      success: true,
      message: 'Feedback responses fetched successfully',
      data: responses,
    })
  } catch (error) {
    console.error('Get Conference Feedback Responses Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

/*
========================================================
  Get Single Feedback Response
  Event Admin
========================================================
*/
export const getConferenceFeedbackResponseById = async (req, res) => {
  try {
    const { eventId, responseId } = req.params

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(responseId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID or response ID',
      })
    }

    const response = await ConferenceFeedbackResponse.findOne({
      _id: responseId,
      eventId,
    }).populate('userId', 'name email mobile')

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Feedback response not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback response fetched successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get Conference Feedback Response By ID Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
