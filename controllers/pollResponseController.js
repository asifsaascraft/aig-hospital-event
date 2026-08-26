import mongoose from 'mongoose'
import Poll from '../models/Poll.js'
import PollResponse from '../models/PollResponse.js'
import Event from '../models/Event.js'

// =======================
// Helper: Round Percentage
// =======================
const calculatePercentage = (value, total) => {
  if (!total) {
    return 0
  }

  return Number(((value / total) * 100).toFixed(2))
}

// =======================
// Helper: Get Effective Status
// =======================
const getEffectivePollStatus = (poll) => {
  const now = new Date()

  if (poll.status === 'draft') {
    return 'draft'
  }

  if (poll.status === 'closed') {
    return 'closed'
  }

  if (now < poll.startDateTime) {
    return 'scheduled'
  }

  if (now > poll.endDateTime) {
    return 'closed'
  }

  return 'active'
}

// =======================
// Helper: Validate Selected Options
// =======================
const validateSelectedOptions = (poll, selectedOptions) => {
  // =======================
  // Basic Validation
  // =======================
  if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
    return {
      valid: false,
      message: 'Please select at least one option',
    }
  }

  // =======================
  // Remove Duplicate IDs
  // =======================
  const normalizedSelectedOptions = selectedOptions.map((optionId) =>
    optionId.toString(),
  )

  const uniqueSelectedOptions = [...new Set(normalizedSelectedOptions)]

  if (uniqueSelectedOptions.length !== normalizedSelectedOptions.length) {
    return {
      valid: false,
      message: 'Duplicate options cannot be selected',
    }
  }

  // =======================
  // Get Active Options
  // =======================
  const activeOptions = poll.poll.options.filter(
    (option) => option.isActive !== false,
  )

  const validOptionIds = activeOptions.map((option) => option._id.toString())

  // =======================
  // Validate Option IDs
  // =======================
  const invalidOption = uniqueSelectedOptions.find(
    (optionId) => !validOptionIds.includes(optionId),
  )

  if (invalidOption) {
    return {
      valid: false,
      message: 'One or more selected options are invalid',
    }
  }

  // =======================
  // Selection Type
  // =======================
  if (poll.poll.selectionType === 'single') {
    if (uniqueSelectedOptions.length !== 1) {
      return {
        valid: false,
        message: 'Only one option can be selected',
      }
    }
  }

  // =======================
  // Multiple Selection
  // =======================
  if (poll.poll.selectionType === 'multiple') {
    const minSelections = poll.poll.minSelections ?? 1
    const maxSelections = poll.poll.maxSelections ?? null

    if (uniqueSelectedOptions.length < minSelections) {
      return {
        valid: false,
        message: `Please select at least ${minSelections} option${
          minSelections > 1 ? 's' : ''
        }`,
      }
    }

    if (
      maxSelections !== null &&
      uniqueSelectedOptions.length > maxSelections
    ) {
      return {
        valid: false,
        message: `You can select a maximum of ${maxSelections} option${
          maxSelections > 1 ? 's' : ''
        }`,
      }
    }
  }

  return {
    valid: true,
    selectedOptions: uniqueSelectedOptions,
  }
}

// =======================
// Helper: Update Vote Counts
// =======================
const updateVoteCounts = async (pollId, optionIds, increment) => {
  if (!optionIds.length) {
    return
  }

  const poll = await Poll.findById(pollId)

  if (!poll) {
    return
  }

  poll.poll.options.forEach((option) => {
    if (optionIds.includes(option._id.toString())) {
      option.voteCount = Math.max(0, (option.voteCount || 0) + increment)
    }
  })

  await poll.save()
}

// =======================
// Submit Poll Response (User)
// =======================
export const submitPollResponse = async (req, res) => {
  try {
    const { eventId } = req.params
    const { pollId, selectedOptions } = req.body
    const userId = req.user._id

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId).select('_id')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Validate Poll ID
    // =======================
    if (!pollId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID is required',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll ID',
      })
    }

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    })

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // =======================
    // Poll Status Validation
    // =======================
    const effectiveStatus = getEffectivePollStatus(poll.poll)

    if (effectiveStatus === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Poll is not available yet',
      })
    }

    if (effectiveStatus === 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Poll has not started yet',
      })
    }

    if (effectiveStatus === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Poll has already ended',
      })
    }

    // =======================
    // Validate Selected Options
    // =======================
    const selectionValidation = validateSelectedOptions(poll, selectedOptions)

    if (!selectionValidation.valid) {
      return res.status(400).json({
        success: false,
        message: selectionValidation.message,
      })
    }

    const normalizedSelectedOptions = selectionValidation.selectedOptions

    // =======================
    // Check Existing Response
    // =======================
    const existingResponse = await PollResponse.findOne({
      pollId,
      userId,
    })

    // =======================
    // Existing Response
    // =======================
    if (existingResponse) {
      // =======================
      // Vote Change Disabled
      // =======================
      if (!poll.poll.allowVoteChange) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this poll',
        })
      }

      // =======================
      // Save Previous Options
      // =======================
      const previousSelectedOptions = existingResponse.selectedOptions.map(
        (id) => id.toString(),
      )

      // =======================
      // Update Response
      // =======================
      existingResponse.selectedOptions = normalizedSelectedOptions

      existingResponse.isSubmitted = true

      await existingResponse.save()

      // =======================
      // Remove Previous Counts
      // =======================
      await updateVoteCounts(pollId, previousSelectedOptions, -1)

      // =======================
      // Add New Counts
      // =======================
      await updateVoteCounts(pollId, normalizedSelectedOptions, 1)

      return res.status(200).json({
        success: true,
        message: 'Poll response updated successfully',
        data: existingResponse,
      })
    }

    // =======================
    // Create New Response
    // =======================
    const response = await PollResponse.create({
      eventId,
      pollId,
      userId,
      selectedOptions: normalizedSelectedOptions,
      isSubmitted: true,
    })

    // =======================
    // Update Vote Counts
    // =======================
    await updateVoteCounts(pollId, normalizedSelectedOptions, 1)

    return res.status(201).json({
      success: true,
      message: 'Poll submitted successfully',
      data: response,
    })
  } catch (error) {
    console.error('Submit Poll Error:', error)

    // =======================
    // Duplicate Response
    // =======================
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this poll',
      })
    }

    // =======================
    // Validation Error
    // =======================
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
    })
  }
}

// =======================
// Get Poll Result (User)
// =======================
export const getPollResult = async (req, res) => {
  try {
    const { eventId, pollId } = req.params

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    })

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // =======================
    // Get Responses
    // =======================
    const responses = await PollResponse.find({
      eventId,
      pollId,
      isSubmitted: true,
    }).select('selectedOptions')

    // =======================
    // Total Participants
    // =======================
    const totalParticipants = responses.length

    // =======================
    // Calculate Total Selections
    // =======================
    const totalSelections = responses.reduce(
      (total, response) => total + response.selectedOptions.length,
      0,
    )

    // =======================
    // Calculate Option Results
    // =======================
    const result = poll.poll.options
      .filter((option) => option.isActive !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((option) => {
        let votes = 0

        responses.forEach((response) => {
          const selected = response.selectedOptions.some(
            (id) => id.toString() === option._id.toString(),
          )

          if (selected) {
            votes++
          }
        })

        return {
          optionId: option._id,
          option: option.optionText,
          votes,

          participantPercentage: calculatePercentage(votes, totalParticipants),

          selectionPercentage: calculatePercentage(votes, totalSelections),
        }
      })

    // =======================
    // Return Result
    // =======================
    return res.status(200).json({
      success: true,
      data: {
        pollId: poll._id,
        eventId: poll.eventId,

        pollTitle: poll.poll.pollTitle,
        description: poll.poll.description,

        selectionType: poll.poll.selectionType,

        minSelections: poll.poll.minSelections,
        maxSelections: poll.poll.maxSelections,

        status: poll.poll.status,

        startDateTime: poll.poll.startDateTime,
        endDateTime: poll.poll.endDateTime,

        allowVoteChange: poll.poll.allowVoteChange,

        totalParticipants,
        totalSelections,

        result,
      },
    })
  } catch (error) {
    console.error('Get Poll Result Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get My Poll Response (User)
// =======================
export const getMyPollResponse = async (req, res) => {
  try {
    const { eventId, pollId } = req.params
    const userId = req.user._id

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    }).select('_id')

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // =======================
    // Find Response
    // =======================
    const response = await PollResponse.findOne({
      eventId,
      pollId,
      userId,
    })

    return res.status(200).json({
      success: true,
      submitted: !!response,
      data: response,
    })
  } catch (error) {
    console.error('Get My Poll Response Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Responses By Poll
// =======================
export const getPollResponsesByPoll = async (req, res) => {
  try {
    const { eventId, pollId } = req.params

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    })

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // =======================
    // Get Submitted Responses
    // =======================
    const responses = await PollResponse.find({
      eventId,
      pollId,
      isSubmitted: true,
    })
      .populate('userId', 'name email mobile')
      .sort({
        createdAt: -1,
      })

    // =======================
    // Total Participants
    // =======================
    const totalParticipants = responses.length

    // =======================
    // Total Selections
    // =======================
    const totalSelections = responses.reduce(
      (total, response) =>
        total + response.selectedOptions.length,
      0,
    )

    // =======================
    // Calculate Option Results
    // =======================
    //
    // IMPORTANT:
    // We use ALL poll options here.
    //
    // Therefore an option with zero votes
    // will also be returned.
    //
    const options = poll.poll.options
      .filter((option) => option.isActive !== false)
      .sort(
        (a, b) =>
          (a.displayOrder ?? 0) -
          (b.displayOrder ?? 0),
      )
      .map((option) => {
        // =======================
        // Count Votes
        // =======================
        let voteCount = 0

        responses.forEach((response) => {
          const selected = response.selectedOptions.some(
            (selectedOptionId) =>
              selectedOptionId.toString() ===
              option._id.toString(),
          )

          if (selected) {
            voteCount++
          }
        })

        // =======================
        // Percentages
        // =======================
        const participantPercentage =
          calculatePercentage(
            voteCount,
            totalParticipants,
          )

        const selectionPercentage =
          calculatePercentage(
            voteCount,
            totalSelections,
          )

        return {
          _id: option._id,
          optionText: option.optionText,

          displayOrder:
            option.displayOrder ?? 0,

          isActive:
            option.isActive !== false,

          voteCount,

          participantPercentage,

          selectionPercentage,
        }
      })

    // =======================
    // Format Individual Responses
    // =======================
    const formattedResponses = responses.map(
      (response) => ({
        _id: response._id,

        user: response.userId,

        selectedOptions:
          response.selectedOptions.map(
            (selectedId) => {
              const option =
                poll.poll.options.find(
                  (opt) =>
                    opt._id.toString() ===
                    selectedId.toString(),
                )

              return {
                optionId: selectedId,

                optionText: option
                  ? option.optionText
                  : '',
              }
            },
          ),

        submittedAt: response.createdAt,

        updatedAt: response.updatedAt,
      }),
    )

    // =======================
    // Build Poll Object
    // =======================
    const pollData = {
      _id: poll._id,

      eventId: poll.eventId,

      pollTitle: poll.poll.pollTitle,

      description:
        poll.poll.description,

      selectionType:
        poll.poll.selectionType,

      minSelections:
        poll.poll.minSelections,

      maxSelections:
        poll.poll.maxSelections,

      status: poll.poll.status,

      effectiveStatus:
        getEffectivePollStatus(
          poll.poll,
        ),

      startDateTime:
        poll.poll.startDateTime,

      endDateTime:
        poll.poll.endDateTime,

      allowVoteChange:
        poll.poll.allowVoteChange,

      displayOrder:
        poll.poll.displayOrder,
    }

    // =======================
    // Return Response
    // =======================
    return res.status(200).json({
      success: true,

      pollId: poll._id,

      poll: pollData,

      totalParticipants,

      totalSelections,

      options,

      data: formattedResponses,
    })
  } catch (error) {
    console.error(
      'Get Poll Responses Error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Poll Summary By Event
// =======================
export const getPollSummaryByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId).select('_id')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Get Polls
    // =======================
    const polls = await Poll.find({
      eventId,
    }).sort({
      'poll.displayOrder': 1,
      createdAt: -1,
    })

    const summary = []

    // =======================
    // Build Summary
    // =======================
    for (const poll of polls) {
      const responses = await PollResponse.find({
        eventId,
        pollId: poll._id,
        isSubmitted: true,
      }).select('selectedOptions')

      const totalParticipants = responses.length

      const totalSelections = responses.reduce(
        (total, response) => total + response.selectedOptions.length,
        0,
      )

      const optionsSummary = poll.poll.options
        .filter((option) => option.isActive !== false)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((option) => {
          let votes = 0

          responses.forEach((response) => {
            const selected = response.selectedOptions.some(
              (id) => id.toString() === option._id.toString(),
            )

            if (selected) {
              votes++
            }
          })

          return {
            optionId: option._id,

            optionText: option.optionText,

            votes,

            participantPercentage: calculatePercentage(
              votes,
              totalParticipants,
            ),

            selectionPercentage: calculatePercentage(votes, totalSelections),
          }
        })

      summary.push({
        pollId: poll._id,

        pollTitle: poll.poll.pollTitle,

        description: poll.poll.description,

        selectionType: poll.poll.selectionType,

        minSelections: poll.poll.minSelections,

        maxSelections: poll.poll.maxSelections,

        status: poll.poll.status,

        effectiveStatus: getEffectivePollStatus(poll.poll),

        startDateTime: poll.poll.startDateTime,

        endDateTime: poll.poll.endDateTime,

        allowVoteChange: poll.poll.allowVoteChange,

        displayOrder: poll.poll.displayOrder,

        totalParticipants,

        totalSelections,

        options: optionsSummary,
      })
    }

    return res.status(200).json({
      success: true,

      totalPolls: summary.length,

      data: summary,
    })
  } catch (error) {
    console.error('Poll Summary Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Poll Response Count
// =======================
export const getPollResponseCount = async (req, res) => {
  try {
    const { eventId, pollId } = req.params

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    }).select('_id')

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      })
    }

    // =======================
    // Count Participants
    // =======================
    const totalParticipants = await PollResponse.countDocuments({
      eventId,
      pollId,
      isSubmitted: true,
    })

    // =======================
    // Get Total Selections
    // =======================
    const responses = await PollResponse.find({
      eventId,
      pollId,
      isSubmitted: true,
    }).select('selectedOptions')

    const totalSelections = responses.reduce(
      (total, response) => total + response.selectedOptions.length,
      0,
    )

    return res.status(200).json({
      success: true,

      pollId,

      totalParticipants,

      totalSelections,
    })
  } catch (error) {
    console.error('Poll Response Count Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
