import Speaker from '../models/Speaker.js'
import SpeakerType from '../models/SpeakerType.js'
import Event from '../models/Event.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'

// =======================
// Create Speaker (EventAdmin)
// =======================
export const createSpeaker = async (req, res) => {
  try {
    const { eventId } = req.params

    const { name, biography, designation, affiliation, speakerTypeId, status } =
      req.body

    // Validate Event
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Validate Speaker Type
    const speakerType = await SpeakerType.findById(speakerTypeId)

    if (!speakerType) {
      return res.status(404).json({
        success: false,
        message: 'Speaker Type not found',
      })
    }

    // Parse social links
    let socialLinks = []

    if (req.body.socialLinks) {
      try {
        socialLinks =
          typeof req.body.socialLinks === 'string'
            ? JSON.parse(req.body.socialLinks)
            : req.body.socialLinks
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid social links format.',
        })
      }
    }

    // Validate social links array
    if (!Array.isArray(socialLinks)) {
      return res.status(400).json({
        success: false,
        message: 'Social links must be an array.',
      })
    }

    let speakerProfileImage = ''

    if (req.file) {
      speakerProfileImage = req.file.location
    }

    const speaker = await Speaker.create({
      eventId,
      name,
      biography,
      designation,
      affiliation,
      speakerProfileImage,
      speakerTypeId,
      status,
      socialLinks,
    })

    return res.status(201).json({
      success: true,
      message: 'Speaker created successfully',
      data: speaker,
    })
  } catch (error) {
    console.error('Create Speaker Error:', error)

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
        message: 'Invalid Speaker data.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Speakers By Event
// =======================
export const getSpeakersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const speakers = await Speaker.find({
      eventId,
    })
      .populate('speakerTypeId', 'speakerType status')
      .sort({
        createdAt: -1,
      })

    return res.status(200).json({
      success: true,
      message: 'Speakers fetched successfully',
      data: speakers,
    })
  } catch (error) {
    console.error('Get Speakers By Event Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Speakers
// =======================
export const getActiveSpeakersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // Pagination
    const { page, limit, skip } = getPagination(req)

    // Search
    const searchQuery = buildSearchQuery(req, ['name', 'designation'])

    // Final Query
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // MongoDB
    const [speakers, total] = await Promise.all([
      Speaker.find(query)
        .populate('speakerTypeId', 'speakerType status')
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Speaker.countDocuments(query),
    ])

    // Pagination
    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Speakers fetched successfully',
      data: speakers,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Speakers Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Speaker By Id
// =======================
export const getSpeakerById = async (req, res) => {
  try {
    const { id } = req.params

    const speaker = await Speaker.findById(id).populate(
      'speakerTypeId',
      'speakerType status',
    )

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Speaker fetched successfully',
      data: speaker,
    })
  } catch (error) {
    console.error('Get Speaker By Id Error:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid speaker ID.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Speaker
// =======================
export const updateSpeaker = async (req, res) => {
  try {
    const { id } = req.params

    const { name, biography, designation, affiliation, speakerTypeId, status } =
      req.body

    const speaker = await Speaker.findById(id)

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      })
    }

    // Validate and update Speaker Type
    if (speakerTypeId !== undefined) {
      const speakerType = await SpeakerType.findById(speakerTypeId)

      if (!speakerType) {
        return res.status(404).json({
          success: false,
          message: 'Speaker Type not found',
        })
      }

      speaker.speakerTypeId = speakerTypeId
    }

    // Update required fields
    if (name !== undefined) {
      speaker.name = name
    }

    if (designation !== undefined) {
      speaker.designation = designation
    }

    if (status !== undefined) {
      speaker.status = status
    }

    // Update optional fields
    if (biography !== undefined) {
      speaker.biography = biography
    }

    if (affiliation !== undefined) {
      speaker.affiliation = affiliation
    }

    // Parse social links
    if (req.body.socialLinks !== undefined) {
      let socialLinks

      try {
        socialLinks =
          typeof req.body.socialLinks === 'string'
            ? JSON.parse(req.body.socialLinks)
            : req.body.socialLinks
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid social links format.',
        })
      }

      if (!Array.isArray(socialLinks)) {
        return res.status(400).json({
          success: false,
          message: 'Social links must be an array.',
        })
      }

      speaker.socialLinks = socialLinks
    }

    // Update profile image
    if (req.file) {
      speaker.speakerProfileImage = req.file.location
    }

    await speaker.save()

    return res.status(200).json({
      success: true,
      message: 'Speaker updated successfully',
      data: speaker,
    })
  } catch (error) {
    console.error('Update Speaker Error:', error)

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
        message: 'Invalid speaker data.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Speaker
// =======================
export const deleteSpeaker = async (req, res) => {
  try {
    const { id } = req.params

    const speaker = await Speaker.findById(id)

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      })
    }

    await speaker.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Speaker deleted successfully',
    })
  } catch (error) {
    console.error('Delete Speaker Error:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid speaker ID.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
