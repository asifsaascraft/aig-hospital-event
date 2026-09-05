// controllers/travelController.js

import Travel from '../models/Travel.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import TravelAgent from '../models/TravelAgent.js'

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
// Helper: Handle Duplicate
// =======================

const isDuplicateTravelError = (error) => {
  return error?.code === 11000
}

// =======================
// Helper: Validate Vehicle Type
// =======================

const isValidVehicleType = (value) => {
  return VEHICLE_TYPES.includes(value)
}

// =======================
// Helper: Parse Multipart JSON
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
// Create Travel
// EventAdmin Only
// =======================

export const createTravel = async (req, res) => {
  try {
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
        message: 'Travel already exists for this registered delegate',
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

      createdBy: 'eventAdmin',
    })

    // =======================
    // RESPONSE
    // =======================

    return res.status(201).json({
      success: true,
      message: 'Travel booking created successfully',
      data: travel,
    })
  } catch (error) {
    console.error('Create travel error:', error)

    if (isDuplicateTravelError(error)) {
      return res.status(409).json({
        success: false,
        message: 'Travel already exists for this registered delegate',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Get All Travel Bookings
// by Event ID
// =======================

export const getTravelByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

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
    // FETCH TRAVEL
    // =======================

    const travels = await Travel.find({ eventId })
      .populate({
        path: 'eventRegistrationId',
        populate: {
          path: 'registrationSlabId',
          select: 'slabName',
        },
      })
      .populate('travelAgentId')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      message: 'Travel bookings fetched successfully',
      data: travels,
    })
  } catch (error) {
    console.error('Get travel error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Update Travel
// EventAdmin Only
// =======================

export const updateTravel = async (req, res) => {
  try {
    const { id } = req.params

    // =======================
    // FIND TRAVEL
    // =======================

    const travel = await Travel.findById(id)

    if (!travel) {
      return res.status(404).json({
        success: false,
        message: 'Travel record not found',
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
    // VALIDATE REGISTRATION
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
          message: 'Travel already exists for this registered delegate',
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

      if (vehicleType !== undefined) {
        if (!isValidVehicleType(vehicleType)) {
          return res.status(400).json({
            success: false,
            message: 'Arrival vehicle type must be flight or train',
          })
        }
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

      if (fromCity !== undefined) {
        travel.arrival.fromCity = fromCity.trim()
      }

      if (toCity !== undefined) {
        travel.arrival.toCity = toCity.trim()
      }

      if (vehicleType !== undefined) {
        travel.arrival.vehicleType = vehicleType
      }

      if (vehicleNumber !== undefined) {
        travel.arrival.vehicleNumber = vehicleNumber.trim()
      }

      if (pickupPoint !== undefined) {
        travel.arrival.pickupPoint = pickupPoint.trim()
      }

      if (pickupDateTime !== undefined) {
        travel.arrival.pickupDateTime = new Date(pickupDateTime)
      }

      if (dropOffPoint !== undefined) {
        travel.arrival.dropOffPoint = dropOffPoint.trim()
      }
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

      if (vehicleType !== undefined) {
        if (!isValidVehicleType(vehicleType)) {
          return res.status(400).json({
            success: false,
            message: 'Departure vehicle type must be flight or train',
          })
        }
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

      if (fromCity !== undefined) {
        travel.departure.fromCity = fromCity.trim()
      }

      if (toCity !== undefined) {
        travel.departure.toCity = toCity.trim()
      }

      if (vehicleType !== undefined) {
        travel.departure.vehicleType = vehicleType
      }

      if (vehicleNumber !== undefined) {
        travel.departure.vehicleNumber = vehicleNumber.trim()
      }

      if (pickupPoint !== undefined) {
        travel.departure.pickupPoint = pickupPoint.trim()
      }

      if (pickupDateTime !== undefined) {
        travel.departure.pickupDateTime = new Date(pickupDateTime)
      }

      if (dropOffPoint !== undefined) {
        travel.departure.dropOffPoint = dropOffPoint.trim()
      }
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
      message: 'Travel record updated successfully',
      data: travel,
    })
  } catch (error) {
    console.error('Update travel error:', error)

    if (isDuplicateTravelError(error)) {
      return res.status(409).json({
        success: false,
        message: 'Travel already exists for this registered delegate',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}

// =======================
// Delete Travel
// EventAdmin Only
// =======================

export const deleteTravel = async (req, res) => {
  try {
    const { id } = req.params

    const travel = await Travel.findById(id)

    if (!travel) {
      return res.status(404).json({
        success: false,
        message: 'Travel record not found',
      })
    }

    await travel.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Travel record deleted successfully',
    })
  } catch (error) {
    console.error('Delete travel error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    })
  }
}
