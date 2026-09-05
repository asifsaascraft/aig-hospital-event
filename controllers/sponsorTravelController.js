// controllers/sponsorTravelController.js

import Travel from '../models/Travel.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import TravelAgent from '../models/TravelAgent.js'
import SponsorTravelQuota from '../models/SponsorTravelQuota.js'
import AssignTravelService from '../models/AssignTravelService.js'

const VEHICLE_TYPES = ['flight', 'train']

// =======================
// Helper: Validate Date
// =======================

const isValidDate = (value) => {
  if (!value) return false

  const date = new Date(value)

  return !Number.isNaN(date.getTime())
}

// =======================
// Helper: Validate Vehicle Type
// =======================

const isValidVehicleType = (value) => {
  return VEHICLE_TYPES.includes(value)
}

// =======================
// Helper: Handle Duplicate
// =======================

const isDuplicateTravelError = (error) => {
  return error?.code === 11000
}

// =======================
// Helper: Parse Multipart JSON
// (arrival / departure arrive as JSON strings
// when the request is multipart/form-data)
// =======================

const parseTravelDetails = (value, fieldName) => {
  if (!value) {
    return {
      value: null,
      error: `${fieldName} travel details are required`,
    }
  }

  if (typeof value === 'object') {
    return {
      value,
      error: null,
    }
  }

  if (typeof value !== 'string') {
    return {
      value: null,
      error: `Invalid ${fieldName} travel details`,
    }
  }

  try {
    const parsed = JSON.parse(value)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        value: null,
        error: `Invalid ${fieldName} travel details`,
      }
    }

    return {
      value: parsed,
      error: null,
    }
  } catch (error) {
    return {
      value: null,
      error: `Invalid ${fieldName} travel details`,
    }
  }
}

// =======================
// Helper: Format Date (IST)
// =======================

const formatDateIST = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

// =======================
// Create Travel (Sponsor Only)
// =======================

export const createTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { eventId } = req.params

    const { eventRegistrationId, fullName, travelAgentId } = req.body

    let { arrival, departure } = req.body

    // =======================
    // PARSE MULTIPART JSON
    // =======================

    const parsedArrival = parseTravelDetails(arrival, 'Arrival')

    if (parsedArrival.error) {
      return res.status(400).json({
        success: false,
        message: parsedArrival.error,
      })
    }

    arrival = parsedArrival.value

    const parsedDeparture = parseTravelDetails(departure, 'Departure')

    if (parsedDeparture.error) {
      return res.status(400).json({
        success: false,
        message: parsedDeparture.error,
      })
    }

    departure = parsedDeparture.value

    // =======================
    // BASIC VALIDATION
    // =======================

    if (!eventRegistrationId) {
      return res.status(400).json({
        success: false,
        message: 'Event registration is required',
      })
    }

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      })
    }

    if (!travelAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Travel agent is required',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ID PDF is required',
      })
    }

    // =======================
    // ARRIVAL VALIDATION
    // =======================

    const {
      fromCity: arrivalFromCity,
      toCity: arrivalToCity,
      vehicleType: arrivalVehicleType,
      vehicleNumber: arrivalVehicleNumber,
      pickupPoint: arrivalPickupPoint,
      pickupDateTime: arrivalPickupDateTime,
      dropOffPoint: arrivalDropOffPoint,
    } = arrival

    if (!arrivalFromCity?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Arrival from city is required',
      })
    }

    if (!arrivalToCity?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Arrival to city is required',
      })
    }

    if (!arrivalVehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Arrival vehicle type is required',
      })
    }

    if (!isValidVehicleType(arrivalVehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Arrival vehicle type must be flight or train',
      })
    }

    if (!arrivalVehicleNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Arrival flight / train number is required',
      })
    }

    if (!arrivalPickupPoint?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Arrival pickup point is required',
      })
    }

    if (!isValidDate(arrivalPickupDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid arrival pickup datetime format',
      })
    }

    if (!arrivalDropOffPoint?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Arrival drop off point is required',
      })
    }

    // =======================
    // DEPARTURE VALIDATION
    // =======================

    const {
      fromCity: departureFromCity,
      toCity: departureToCity,
      vehicleType: departureVehicleType,
      vehicleNumber: departureVehicleNumber,
      pickupPoint: departurePickupPoint,
      pickupDateTime: departurePickupDateTime,
      dropOffPoint: departureDropOffPoint,
    } = departure

    if (!departureFromCity?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Departure from city is required',
      })
    }

    if (!departureToCity?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Departure to city is required',
      })
    }

    if (!departureVehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Departure vehicle type is required',
      })
    }

    if (!isValidVehicleType(departureVehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Departure vehicle type must be flight or train',
      })
    }

    if (!departureVehicleNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Departure flight / train number is required',
      })
    }

    if (!departurePickupPoint?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Departure pickup point is required',
      })
    }

    if (!isValidDate(departurePickupDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid departure pickup datetime format',
      })
    }

    if (!departureDropOffPoint?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Departure drop off point is required',
      })
    }

    // =======================
    // VALIDATE EVENT
    // =======================

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // =======================
    // VALIDATE REGISTRATION
    // =======================

    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Event registration not found for this event',
      })
    }

    // =======================
    // CHECK DUPLICATE TRAVEL
    // =======================

    const existingTravel = await Travel.findOne({
      eventId,
      eventRegistrationId,
    })

    if (existingTravel) {
      return res.status(400).json({
        success: false,
        message: 'Travel already booked for this registration',
      })
    }

    // =======================
    // VALIDATE TRAVEL AGENT
    // =======================

    const agent = await TravelAgent.findOne({
      _id: travelAgentId,
      status: 'Active',
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Active travel agent not found',
      })
    }

    // =======================
    // QUOTA CHECK
    // =======================

    const quotaData = await SponsorTravelQuota.findOne({
      eventId,
      sponsorId,
    })

    if (!quotaData) {
      return res.status(403).json({
        success: false,
        message: 'No travel quota assigned to this sponsor',
      })
    }

    // =======================
    // QUOTA WINDOW VALIDATION
    // =======================

    const currentDateTime = new Date()

    if (quotaData.startDateTime && currentDateTime < quotaData.startDateTime) {
      return res.status(400).json({
        success: false,
        message: `Travel booking will start from ${formatDateIST(
          quotaData.startDateTime,
        )}`,
      })
    }

    if (quotaData.endDateTime && currentDateTime > quotaData.endDateTime) {
      return res.status(400).json({
        success: false,
        message: `Travel booking closed on ${formatDateIST(
          quotaData.endDateTime,
        )}`,
      })
    }

    // =======================
    // QUOTA LIMIT CHECK
    // =======================

    const usedQuota = await Travel.countDocuments({
      eventId,
      sponsorId,
      createdBy: 'sponsor',
    })

    if (usedQuota >= quotaData.quota) {
      return res.status(400).json({
        success: false,
        message: 'Travel quota exceeded',
      })
    }

    // =======================
    // CREATE TRAVEL
    // =======================

    const travel = await Travel.create({
      eventId,

      eventRegistrationId,

      fullName: fullName.trim(),

      idUpload: req.file.location,

      travelAgentId,

      arrival: {
        fromCity: arrivalFromCity.trim(),

        toCity: arrivalToCity.trim(),

        vehicleType: arrivalVehicleType,

        vehicleNumber: arrivalVehicleNumber.trim(),

        pickupPoint: arrivalPickupPoint.trim(),

        pickupDateTime: new Date(arrivalPickupDateTime),

        dropOffPoint: arrivalDropOffPoint.trim(),
      },

      departure: {
        fromCity: departureFromCity.trim(),

        toCity: departureToCity.trim(),

        vehicleType: departureVehicleType,

        vehicleNumber: departureVehicleNumber.trim(),

        pickupPoint: departurePickupPoint.trim(),

        pickupDateTime: new Date(departurePickupDateTime),

        dropOffPoint: departureDropOffPoint.trim(),
      },

      sponsorId,

      createdBy: 'sponsor',
    })

    return res.status(201).json({
      success: true,
      message: 'Travel created by sponsor successfully',
      data: travel,
    })
  } catch (error) {
    console.error('Sponsor create travel error:', error)

    if (isDuplicateTravelError(error)) {
      return res.status(409).json({
        success: false,
        message: 'Travel already booked for this registration',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Sponsor Travel Bookings by Specific Sponsor
// =======================

export const getTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { eventId } = req.params

    const travels = await Travel.find({
      eventId,
      sponsorId,
      createdBy: 'sponsor',
    })
      .populate('travelAgentId')
      .populate({
        path: 'eventRegistrationId',
        populate: {
          path: 'registrationSlabId',
          select: 'slabName',
        },
      })
      .sort({ createdAt: -1 })

    // ===============================
    // GET ASSIGNED REGISTRATION IDS
    // ===============================

    const assignedData = await AssignTravelService.findOne({
      eventId,
      sponsorId,
    })

    const assignedRegistrationIds = assignedData
      ? assignedData.eventRegistrationId.map((id) => id.toString())
      : []

    // ===============================
    // ADD STATUS FIELD
    // ===============================

    const data = travels.map((item) => ({
      ...item.toObject(),

      // true = came from AssignTravelService
      // false = normal sponsor booking
      isAssignedTravelService: assignedRegistrationIds.includes(
        item.eventRegistrationId?._id?.toString(),
      ),
    }))

    return res.status(200).json({
      success: true,
      message: 'Sponsor travel fetched successfully',
      data,
    })
  } catch (error) {
    console.error('Sponsor get travel error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get My Booked Assigned Travels
// =======================

export const getMyBookedAssignedTravels = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { eventId } = req.params

    // ===============================
    // GET ASSIGNED DELEGATES
    // ===============================

    const assignedData = await AssignTravelService.findOne({
      eventId,
      sponsorId,
    })

    if (!assignedData) {
      return res.status(404).json({
        success: false,
        message: 'No assigned travel services found',
      })
    }

    const assignedRegistrationIds = assignedData.eventRegistrationId.map((id) =>
      id.toString(),
    )

    // ===============================
    // GET ONLY BOOKED ASSIGNED TRAVEL
    // ===============================

    const travels = await Travel.find({
      eventId,
      sponsorId,
      createdBy: 'sponsor',

      eventRegistrationId: {
        $in: assignedRegistrationIds,
      },
    })
      .populate('travelAgentId')
      .populate({
        path: 'eventRegistrationId',
        populate: {
          path: 'registrationSlabId',
          select: 'slabName',
        },
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      message: 'Booked assigned travel fetched successfully',
      data: travels,
    })
  } catch (error) {
    console.error('Get Booked Assigned Travel Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

// =======================
// Update Travel (Sponsor Only)
// =======================

export const updateTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { id } = req.params

    // =======================
    // FIND TRAVEL (must belong to this sponsor)
    // =======================

    const travel = await Travel.findOne({
      _id: id,
      sponsorId,
      createdBy: 'sponsor',
    })

    if (!travel) {
      return res.status(404).json({
        success: false,
        message: 'Travel not found or not authorized',
      })
    }

    let { fullName, eventRegistrationId, travelAgentId, arrival, departure } =
      req.body

    // =======================
    // PARSE MULTIPART JSON
    // =======================

    if (arrival !== undefined) {
      const parsedArrival = parseTravelDetails(arrival, 'Arrival')

      if (parsedArrival.error) {
        return res.status(400).json({
          success: false,
          message: parsedArrival.error,
        })
      }

      arrival = parsedArrival.value
    }

    if (departure !== undefined) {
      const parsedDeparture = parseTravelDetails(departure, 'Departure')

      if (parsedDeparture.error) {
        return res.status(400).json({
          success: false,
          message: parsedDeparture.error,
        })
      }

      departure = parsedDeparture.value
    }

    // =======================
    // VALIDATE FULL NAME
    // =======================

    if (fullName !== undefined && !fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot be empty',
      })
    }

    // =======================
    // VALIDATE REGISTRATION / DUPLICATE CHECK
    // =======================

    if (eventRegistrationId) {
      const registration = await EventRegistration.findOne({
        _id: eventRegistrationId,
        eventId: travel.eventId,
      })

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Event registration not found for this event',
        })
      }

      const existingTravel = await Travel.findOne({
        eventId: travel.eventId,
        eventRegistrationId,
        _id: { $ne: id },
      })

      if (existingTravel) {
        return res.status(409).json({
          success: false,
          message: 'Travel already booked for this registration',
        })
      }
    }

    // =======================
    // VALIDATE TRAVEL AGENT
    // =======================

    if (travelAgentId) {
      const agent = await TravelAgent.findOne({
        _id: travelAgentId,
        status: 'Active',
      })

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Active travel agent not found',
        })
      }
    }

    // =======================
    // UPDATE BASIC FIELDS
    // =======================

    if (fullName !== undefined) {
      travel.fullName = fullName.trim()
    }

    if (eventRegistrationId) {
      travel.eventRegistrationId = eventRegistrationId
    }

    if (travelAgentId) {
      travel.travelAgentId = travelAgentId
    }

    // =======================
    // UPDATE ARRIVAL
    // =======================

    if (arrival) {
      const {
        fromCity,
        toCity,
        vehicleType,
        vehicleNumber,
        pickupPoint,
        pickupDateTime,
        dropOffPoint,
      } = arrival

      if (fromCity !== undefined && !fromCity?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Arrival from city cannot be empty',
        })
      }

      if (toCity !== undefined && !toCity?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Arrival to city cannot be empty',
        })
      }

      if (vehicleType !== undefined && !isValidVehicleType(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: 'Arrival vehicle type must be flight or train',
        })
      }

      if (vehicleNumber !== undefined && !vehicleNumber?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Arrival flight / train number cannot be empty',
        })
      }

      if (pickupPoint !== undefined && !pickupPoint?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Arrival pickup point cannot be empty',
        })
      }

      if (pickupDateTime !== undefined && !isValidDate(pickupDateTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid arrival pickup datetime format',
        })
      }

      if (dropOffPoint !== undefined && !dropOffPoint?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Arrival drop off point cannot be empty',
        })
      }

      if (fromCity !== undefined) travel.arrival.fromCity = fromCity.trim()
      if (toCity !== undefined) travel.arrival.toCity = toCity.trim()
      if (vehicleType !== undefined) travel.arrival.vehicleType = vehicleType
      if (vehicleNumber !== undefined)
        travel.arrival.vehicleNumber = vehicleNumber.trim()
      if (pickupPoint !== undefined)
        travel.arrival.pickupPoint = pickupPoint.trim()
      if (pickupDateTime !== undefined)
        travel.arrival.pickupDateTime = new Date(pickupDateTime)
      if (dropOffPoint !== undefined)
        travel.arrival.dropOffPoint = dropOffPoint.trim()
    }

    // =======================
    // UPDATE DEPARTURE
    // =======================

    if (departure) {
      const {
        fromCity,
        toCity,
        vehicleType,
        vehicleNumber,
        pickupPoint,
        pickupDateTime,
        dropOffPoint,
      } = departure

      if (fromCity !== undefined && !fromCity?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Departure from city cannot be empty',
        })
      }

      if (toCity !== undefined && !toCity?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Departure to city cannot be empty',
        })
      }

      if (vehicleType !== undefined && !isValidVehicleType(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: 'Departure vehicle type must be flight or train',
        })
      }

      if (vehicleNumber !== undefined && !vehicleNumber?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Departure flight / train number cannot be empty',
        })
      }

      if (pickupPoint !== undefined && !pickupPoint?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Departure pickup point cannot be empty',
        })
      }

      if (pickupDateTime !== undefined && !isValidDate(pickupDateTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid departure pickup datetime format',
        })
      }

      if (dropOffPoint !== undefined && !dropOffPoint?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Departure drop off point cannot be empty',
        })
      }

      if (fromCity !== undefined) travel.departure.fromCity = fromCity.trim()
      if (toCity !== undefined) travel.departure.toCity = toCity.trim()
      if (vehicleType !== undefined) travel.departure.vehicleType = vehicleType
      if (vehicleNumber !== undefined)
        travel.departure.vehicleNumber = vehicleNumber.trim()
      if (pickupPoint !== undefined)
        travel.departure.pickupPoint = pickupPoint.trim()
      if (pickupDateTime !== undefined)
        travel.departure.pickupDateTime = new Date(pickupDateTime)
      if (dropOffPoint !== undefined)
        travel.departure.dropOffPoint = dropOffPoint.trim()
    }

    // =======================
    // FILE UPDATE
    // =======================

    if (req.file) {
      travel.idUpload = req.file.location
    }

    // =======================
    // SAVE
    // =======================

    await travel.save()

    return res.status(200).json({
      success: true,
      message: 'Sponsor travel updated',
      data: travel,
    })
  } catch (error) {
    console.error('Sponsor update error:', error)

    if (isDuplicateTravelError(error)) {
      return res.status(409).json({
        success: false,
        message: 'Travel already booked for this registration',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// ======================================
// GET SPONSOR TRAVEL QUOTA SUMMARY (Sponsor Only)
// ======================================

export const getSponsorTravelQuotaSummary = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { eventId } = req.params

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required',
      })
    }

    // ===============================
    // Step 1: Fetch quota record
    // ===============================

    const quotaRecord = await SponsorTravelQuota.findOne({
      sponsorId,
      eventId,
    })

    if (!quotaRecord) {
      return res.status(404).json({
        success: false,
        message: 'No travel quota assigned for this sponsor',
      })
    }

    // ===============================
    // Step 2: Count used travel
    // ===============================

    const usedTravel = await Travel.countDocuments({
      sponsorId,
      eventId,
      createdBy: 'sponsor',
    })

    // ===============================
    // Step 3: Calculate remaining
    // ===============================

    const remaining = Math.max(quotaRecord.quota - usedTravel, 0)

    // ===============================
    // Step 4: Response
    // ===============================

    return res.status(200).json({
      success: true,
      message: 'Sponsor travel quota summary fetched successfully',
      data: {
        sponsorId,
        eventId,
        totalQuota: quotaRecord.quota,
        usedTravel,
        remainingQuota: remaining,
        startDateTime: quotaRecord.startDateTime,
        endDateTime: quotaRecord.endDateTime,
        status: quotaRecord.status,
      },
    })
  } catch (error) {
    console.error('Get Sponsor Travel Quota Summary error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching travel quota summary',
    })
  }
}

// ======================================
// GET USED TRAVEL AGENTS BY SPONSOR
// ======================================

export const getSponsorTravelAgents = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id
    const { eventId } = req.params

    // Step 1: Find unique travelAgentIds

    const travels = await Travel.find({
      eventId,
      sponsorId,
      createdBy: 'sponsor',
    }).distinct('travelAgentId')

    // Step 2: Fetch full travel agent data

    const travelAgents = await TravelAgent.find({
      _id: { $in: travels },
    })

    return res.status(200).json({
      success: true,
      message: 'Sponsor used travel agents fetched successfully',
      count: travelAgents.length,
      data: travelAgents,
    })
  } catch (error) {
    console.error('Get sponsor travel agents error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
