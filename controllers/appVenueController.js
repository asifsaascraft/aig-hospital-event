import AppVenue from '../models/AppVenue.js'
import Event from '../models/Event.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'

// =======================
// Create Venue (EventAdmin Only)
// =======================
export const createVenue = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      venueName,
      venueDescription,
      iFrameLink,
      halls,
      parking,
      accommodation,
      transportation,
      nearbyFacilities,
      status,
    } = req.body

    // =======================
    // Validate Required Fields
    // =======================
    if (!venueName || !iFrameLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Venue Name, iFrame Link and Status are required',
      })
    }

    // =======================
    // Validate Status
    // =======================
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive',
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
    // Create Venue
    // =======================
    const venue = await AppVenue.create({
      eventId,
      venueName,
      venueDescription,
      iFrameLink,
      halls: halls ?? [],
      parking: parking ?? {},
      accommodation: accommodation ?? [],
      transportation: transportation ?? [],
      nearbyFacilities: nearbyFacilities ?? [],
      status,
    })

    return res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue,
    })
  } catch (error) {
    console.error('Create Venue Error:', error)

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
// Get All Venues By Event
// =======================
export const getVenuesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const venues = await AppVenue.find({
      eventId,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      message: 'Venues fetched successfully',
      data: venues,
    })
  } catch (error) {
    console.error('Get Venues Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Venues
// =======================
export const getActiveVenuesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Pagination
    // =======================
    const { page, limit, skip } = getPagination(req)

    // =======================
    // Search
    // =======================
    const searchQuery = buildSearchQuery(req, ['venueName'])

    // =======================
    // Final Query
    // =======================
    const query = {
      eventId,
      status: 'Active',
      ...searchQuery,
    }

    // =======================
    // MongoDB
    // =======================
    const [venues, total] = await Promise.all([
      AppVenue.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      AppVenue.countDocuments(query),
    ])

    // =======================
    // Pagination
    // =======================
    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Venues fetched successfully',
      data: venues,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Venues Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Venue By Id
// =======================
export const getVenueById = async (req, res) => {
  try {
    const { id } = req.params

    const venue = await AppVenue.findById(id)

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Venue fetched successfully',
      data: venue,
    })
  } catch (error) {
    console.error('Get Venue By Id Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Venue
// =======================
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params

    const {
      venueName,
      venueDescription,
      iFrameLink,
      halls,
      parking,
      accommodation,
      transportation,
      nearbyFacilities,
      status,
    } = req.body

    // =======================
    // Find Venue
    // =======================
    const venue = await AppVenue.findById(id)

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      })
    }

    // =======================
    // Validate Required Fields
    // =======================
    if (!venueName || !iFrameLink || !status) {
      return res.status(400).json({
        success: false,
        message: 'Venue Name, iFrame Link and Status are required',
      })
    }

    // =======================
    // Validate Status
    // =======================
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive',
      })
    }

    // =======================
    // Update Basic Information
    // =======================
    venue.venueName = venueName
    venue.iFrameLink = iFrameLink
    venue.status = status

    // Description is optional and can be cleared
    if (venueDescription !== undefined) {
      venue.venueDescription = venueDescription
    }

    // =======================
    // Update Hall / Room List
    // =======================
    if (halls !== undefined) {
      venue.halls = halls
    }

    // =======================
    // Update Parking
    // =======================
    if (parking !== undefined) {
      venue.parking = parking
    }

    // =======================
    // Update Accommodation
    // =======================
    if (accommodation !== undefined) {
      venue.accommodation = accommodation
    }

    // =======================
    // Update Transportation
    // =======================
    if (transportation !== undefined) {
      venue.transportation = transportation
    }

    // =======================
    // Update Nearby Facilities
    // =======================
    if (nearbyFacilities !== undefined) {
      venue.nearbyFacilities = nearbyFacilities
    }

    // =======================
    // Save
    // =======================
    await venue.save()

    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: venue,
    })
  } catch (error) {
    console.error('Update Venue Error:', error)

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
// Delete Venue
// =======================
export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params

    const venue = await AppVenue.findById(id)

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      })
    }

    await venue.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Venue deleted successfully',
    })
  } catch (error) {
    console.error('Delete Venue Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
