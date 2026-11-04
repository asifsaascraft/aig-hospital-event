import AppOrganizer from '../models/AppOrganizer.js'
import AppOrganizerType from '../models/AppOrganizerType.js'
import Event from '../models/Event.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'

// =======================
// Helpers
// =======================

const parseSocialLinks = (socialLinks) => {
  if (socialLinks === undefined || socialLinks === null || socialLinks === '') {
    return []
  }

  if (Array.isArray(socialLinks)) {
    return socialLinks
  }

  if (typeof socialLinks === 'string') {
    try {
      const parsed = JSON.parse(socialLinks)

      if (!Array.isArray(parsed)) {
        throw new Error('Social links must be an array.')
      }

      return parsed
    } catch {
      throw new Error('Invalid socialLinks JSON.')
    }
  }

  throw new Error('Invalid socialLinks format.')
}

const parseFeatured = (featured) => {
  if (featured === undefined || featured === null || featured === '') {
    return undefined
  }

  if (typeof featured === 'boolean') {
    return featured
  }

  if (typeof featured === 'string') {
    if (featured === 'true') return true
    if (featured === 'false') return false
  }

  return undefined
}

// =======================
// Create Organizer Member
// =======================
export const createOrganizerMember = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      name,
      designation,
      affiliation,
      aboutOrganizer,
      email,
      mobile,
      organizerTypeId,
      status,
      featured,
      socialLinks,
      featuredOrder,
    } = req.body

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      })
    }

    // =======================
    // Validate Organizer Type
    // =======================
    const organizerType = await AppOrganizerType.findById(organizerTypeId)

    if (!organizerType) {
      return res.status(404).json({
        message: 'Organizer Type not found',
      })
    }

    // =======================
    // Parse Social Links
    // =======================
    let parsedSocialLinks = []

    try {
      parsedSocialLinks = parseSocialLinks(socialLinks)
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    // =======================
    // Parse Featured
    // =======================
    const parsedFeatured = parseFeatured(featured)

    // =======================
    // Profile Image
    // =======================
    let organizerProfileImage = ''

    if (req.file) {
      organizerProfileImage = req.file.location
    }

    // =======================
    // Create Organizer
    // =======================
    const organizer = await AppOrganizer.create({
      eventId,
      organizerTypeId,
      name,
      designation,
      affiliation,
      aboutOrganizer,
      email,
      mobile,
      socialLinks: parsedSocialLinks,
      organizerProfileImage,
      ...(parsedFeatured !== undefined && {
        featured: parsedFeatured,
        featuredOrder:
          parsedFeatured === true ? Number(featuredOrder) || null : null,
      }),
      status,
    })

    return res.status(201).json({
      success: true,
      message: 'Organizer Member created successfully',
      data: organizer,
    })
  } catch (error) {
    console.error('Create Organizer Member Error:', error)

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
        message: 'Invalid data provided.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Organizer Members By Event
// =======================
export const getOrganizerMembersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const organizers = await AppOrganizer.find({
      eventId,
    })
      .populate('organizerTypeId', 'organizerType status')
      .sort({
        createdAt: -1,
      })

    return res.status(200).json({
      success: true,
      message: 'Organizer Members fetched successfully',
      data: organizers,
    })
  } catch (error) {
    console.error('Get Organizer Members Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Active Organizer Members
// =======================
export const getActiveOrganizerMembersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    // =======================
    // Pagination
    // =======================
    const { page, limit, skip } = getPagination(req)

    // =======================
    // Search
    // =======================
    const searchQuery = buildSearchQuery(req, [
      'name',
      'designation',
      'affiliation',
      'aboutOrganizer',
      'email',
      'mobile',
    ])

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
    const [organizers, total] = await Promise.all([
      AppOrganizer.find(query)
        .populate('organizerTypeId', 'organizerType status')
        .sort({
          featured: -1,
          featuredOrder: 1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      AppOrganizer.countDocuments(query),
    ])

    // =======================
    // Pagination
    // =======================
    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Active Organizer Members fetched successfully',
      data: organizers,
      pagination,
    })
  } catch (error) {
    console.error('Get Active Organizer Members Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get Organizer Member By Id
// =======================
export const getOrganizerMemberById = async (req, res) => {
  try {
    const { id } = req.params

    const organizer = await AppOrganizer.findById(id).populate(
      'organizerTypeId',
      'organizerType status',
    )

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer Member not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Organizer Member fetched successfully',
      data: organizer,
    })
  } catch (error) {
    console.error('Get Organizer Member By Id Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Organizer Member
// =======================
export const updateOrganizerMember = async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      designation,
      affiliation,
      aboutOrganizer,
      email,
      mobile,
      organizerTypeId,
      status,
      featured,
      featuredOrder,
      socialLinks,
    } = req.body

    // =======================
    // Find Organizer
    // =======================
    const organizer = await AppOrganizer.findById(id)

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer Member not found',
      })
    }

    // =======================
    // Validate Organizer Type
    // =======================
    if (organizerTypeId) {
      const organizerType = await AppOrganizerType.findById(organizerTypeId)

      if (!organizerType) {
        return res.status(404).json({
          success: false,
          message: 'Organizer Type not found',
        })
      }

      organizer.organizerTypeId = organizerTypeId
    }

    // =======================
    // Basic Information
    // =======================
    if (name !== undefined) {
      organizer.name = name
    }

    if (designation !== undefined) {
      organizer.designation = designation
    }

    if (affiliation !== undefined) {
      organizer.affiliation = affiliation
    }

    if (aboutOrganizer !== undefined) {
      organizer.aboutOrganizer = aboutOrganizer
    }

    // =======================
    // Contact Information
    // =======================
    if (email !== undefined) {
      organizer.email = email
    }

    if (mobile !== undefined) {
      organizer.mobile = mobile
    }

    // =======================
    // Social Links
    // =======================
    if (socialLinks !== undefined) {
      try {
        organizer.socialLinks = parseSocialLinks(socialLinks)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    // =======================
    // Featured
    // =======================
    const parsedFeatured = parseFeatured(featured)

    if (parsedFeatured !== undefined) {
      organizer.featured = parsedFeatured

      if (!parsedFeatured) {
        organizer.featuredOrder = null
      }
    }

    if (featuredOrder !== undefined) {
      organizer.featuredOrder =
        featuredOrder === null || featuredOrder === ''
          ? null
          : Number(featuredOrder)
    }

    // =======================
    // Status
    // =======================
    if (status !== undefined) {
      organizer.status = status
    }

    // =======================
    // Profile Image
    // =======================
    if (req.file) {
      organizer.organizerProfileImage = req.file.location
    }

    // =======================
    // Save
    // =======================
    await organizer.save()

    return res.status(200).json({
      success: true,
      message: 'Organizer Member updated successfully',
      data: organizer,
    })
  } catch (error) {
    console.error('Update Organizer Member Error:', error)

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
        message: 'Invalid data provided.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Organizer Member
// =======================
export const deleteOrganizerMember = async (req, res) => {
  try {
    const { id } = req.params

    const organizer = await AppOrganizer.findById(id)

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer Member not found',
      })
    }

    await organizer.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Organizer Member deleted successfully',
    })
  } catch (error) {
    console.error('Delete Organizer Member Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
