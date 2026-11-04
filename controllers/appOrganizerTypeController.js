import OrganizerType from '../models/AppOrganizerType.js'
import Event from '../models/Event.js'

// =======================
// Create Organizer Type (EventAdmin Only)
// =======================
export const createOrganizerType = async (req, res) => {
  try {
    const { eventId } = req.params
    const { organizerType, status } = req.body

    // Validate event existence
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      })
    }

    // Create Organizer Type
    const organizer = await OrganizerType.create({
      eventId,
      organizerType,
      status,
    })

    return res.status(201).json({
      success: true,
      message: 'Organizer Type created successfully',
      data: organizer,
    })
  } catch (error) {
    console.error('Create Organizer Type Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        message: errors.join(', '),
      })
    }

    return res.status(500).json({
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Organizer Types by Event
// =======================
export const getOrganizerTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const organizerTypes = await OrganizerType.find({
      eventId,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      message: 'Organizer Types fetched successfully',
      data: organizerTypes,
    })
  } catch (error) {
    console.error('Get Organizer Types Error:', error)

    return res.status(500).json({
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Organizer Types
// =======================
export const getActiveOrganizerTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const organizerTypes = await OrganizerType.find({
      eventId,
      status: 'Active',
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      message: 'Active Organizer Types fetched successfully',
      data: organizerTypes,
    })
  } catch (error) {
    console.error('Get Active Organizer Types Error:', error)

    return res.status(500).json({
      message: 'Server Error',
    })
  }
}

// =======================
// Update Organizer Type
// =======================
export const updateOrganizerType = async (req, res) => {
  try {
    const { id } = req.params
    const { organizerType, status } = req.body

    const organizer = await OrganizerType.findById(id)

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer Type not found',
      })
    }

    if (organizerType) {
      organizer.organizerType = organizerType
    }

    if (status) {
      organizer.status = status
    }

    await organizer.save()

    return res.status(200).json({
      success: true,
      message: 'Organizer Type updated successfully',
      data: organizer,
    })
  } catch (error) {
    console.error('Update Organizer Type Error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message)

      return res.status(400).json({
        message: errors.join(', '),
      })
    }

    return res.status(500).json({
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Organizer Type
// =======================
export const deleteOrganizerType = async (req, res) => {
  try {
    const { id } = req.params

    const organizer = await OrganizerType.findById(id)

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer Type not found',
      })
    }

    await organizer.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Organizer Type deleted successfully',
    })
  } catch (error) {
    console.error('Delete Organizer Type Error:', error)

    return res.status(500).json({
      message: 'Server Error',
    })
  }
}
