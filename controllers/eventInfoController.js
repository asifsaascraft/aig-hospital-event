import EventInfo from '../models/EventInfo.js'
import Event from '../models/Event.js'

// =======================
// Create Event Info
// EventAdmin
//
// Unlimited EventInfo allowed per event
// =======================
export const createEventInfo = async (req, res) => {
  try {
    const { eventId } = req.params
    const { title, welcomeMessage } = req.body

    // =======================
    // Validate title
    // =======================

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      })
    }

    // =======================
    // Validate welcome message
    // =======================

    if (!welcomeMessage || !welcomeMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Welcome message is required',
      })
    }

    // =======================
    // Check event exists
    // =======================

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Uploaded banner image
    // =======================

    const bannerImage = req.file?.location || null

    // =======================
    // Create EventInfo
    //
    // No existing-record check.
    // Unlimited EventInfo allowed.
    // =======================

    const eventInfo = await EventInfo.create({
      eventId,
      title: title.trim(),
      welcomeMessage: welcomeMessage.trim(),
      bannerImage,
    })

    return res.status(201).json({
      success: true,
      message: 'Event info created successfully',
      data: eventInfo,
    })
  } catch (error) {
    console.error('Create Event Info Error:', error)

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
// Get Event Info By Event
// Public
//
// Returns ALL EventInfo records
// belonging to the event.
// =======================
export const getEventInfoByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Check event exists
    // =======================

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Get ALL EventInfo records
    // =======================

    const eventInfos = await EventInfo.find({
      eventId,
    })
      .populate('eventId', 'eventName dynamicStatus')
      .sort({ createdAt: 1 })

    return res.status(200).json({
      success: true,
      message: 'Event info fetched successfully',
      data: eventInfos,
    })
  } catch (error) {
    console.error('Get Event Info By Event Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Event Info By Id
// =======================
export const getEventInfoById = async (req, res) => {
  try {
    const { id } = req.params

    const eventInfo = await EventInfo.findById(id).populate(
      'eventId',
      'eventName dynamicStatus',
    )

    if (!eventInfo) {
      return res.status(404).json({
        success: false,
        message: 'Event info not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Event info fetched successfully',
      data: eventInfo,
    })
  } catch (error) {
    console.error('Get Event Info By Id Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Event Info
// EventAdmin
//
// Route:
// PUT /event-admin/events/:eventId/event-info/:id
//
// Updates ONE specific EventInfo.
// =======================
export const updateEventInfo = async (req, res) => {
  try {
    const { eventId, id } = req.params
    const { title, welcomeMessage, removeBannerImage } = req.body

    // =======================
    // Check event exists
    // =======================

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Find specific EventInfo
    // =======================

    const eventInfo = await EventInfo.findOne({
      _id: id,
      eventId,
    })

    if (!eventInfo) {
      return res.status(404).json({
        success: false,
        message: 'Event info not found for this event',
      })
    }

    // =======================
    // Update title
    // =======================

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title is required',
        })
      }

      eventInfo.title = title.trim()
    }

    // =======================
    // Update welcome message
    // =======================

    if (welcomeMessage !== undefined) {
      if (!welcomeMessage.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Welcome message is required',
        })
      }

      eventInfo.welcomeMessage = welcomeMessage.trim()
    }

    // =======================
    // Update banner image
    // =======================

    if (req.file) {
      eventInfo.bannerImage = req.file.location
    }

    // =======================
    // Remove banner image
    // =======================

    if (removeBannerImage === true || removeBannerImage === 'true') {
      eventInfo.bannerImage = null
    }

    await eventInfo.save()

    return res.status(200).json({
      success: true,
      message: 'Event info updated successfully',
      data: eventInfo,
    })
  } catch (error) {
    console.error('Update Event Info Error:', error)

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
// Delete Event Info
// EventAdmin
//
// Route:
// DELETE /event-admin/events/:eventId/event-info/:id
//
// Deletes ONE specific EventInfo.
// =======================
export const deleteEventInfo = async (req, res) => {
  try {
    const { eventId, id } = req.params

    // =======================
    // Check event exists
    // =======================

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // Find specific EventInfo
    // =======================

    const eventInfo = await EventInfo.findOne({
      _id: id,
      eventId,
    })

    if (!eventInfo) {
      return res.status(404).json({
        success: false,
        message: 'Event info not found for this event',
      })
    }

    await eventInfo.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Event info deleted successfully',
    })
  } catch (error) {
    console.error('Delete Event Info Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
