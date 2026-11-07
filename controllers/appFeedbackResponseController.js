import mongoose from 'mongoose'
import ConferenceFeedback from '../models/AppFeedback.js'
import ConferenceFeedbackResponse from '../models/AppFeedbackResponse.js'
import Event from '../models/Event.js'




const validateFeedbackWindow = (feedback) => {
  const now = new Date()

  const startDate = new Date(feedback.startDateTime)
  const endDate = new Date(feedback.endDateTime)

  if (
    !feedback.startDateTime ||
    !feedback.endDateTime ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return 'Feedback form availability dates are not configured'
  }

  if (startDate > endDate) {
    return 'Invalid feedback form availability dates'
  }

  if (now < startDate) {
    return 'Feedback form is not open yet'
  }

  if (now > endDate) {
    return 'Feedback form has closed'
  }

  return null
}


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

    // Verify event exists.
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Get the published feedback form.
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

    // Validate feedback form availability dates.
    // Event startDateTime and endDateTime are not used.
    const dateError = validateFeedbackWindow(feedback)

    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError,
      })
    }

    // Prevent duplicate submission.
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

    // Validate answers against published questions.
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

    // Check whether this user has already submitted.
    // Return submitted status even if the feedback deadline has passed.
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

    // Validate feedback form dates, not event dates.
    const dateError = validateFeedbackWindow(feedback)

    if (dateError) {
      return res.status(403).json({
        success: false,
        submitted: false,
        message: dateError,
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
