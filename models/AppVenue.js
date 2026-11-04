import mongoose from 'mongoose'

const HallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: String,
      trim: true,
    },

    capacity: {
      type: Number,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
)

const ParkingSchema = new mongoose.Schema(
  {
    available: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
)

const AccommodationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    distance: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    bookingLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
)

const TransportationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
)

const NearbyFacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    distance: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
)

const AppVenueSchema = new mongoose.Schema(
  {
    // =========================
    // Event
    // =========================
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    // =========================
    // Basic Venue Information
    // =========================
    venueName: {
      type: String,
      required: [true, 'Venue Name is required'],
      trim: true,
    },

    venueDescription: {
      type: String,
      trim: true,
      default: '',
    },

    iFrameLink: {
      type: String,
      required: [true, 'iFrame Link is required'],
      trim: true,
    },

    // =========================
    // Hall / Room Information
    // =========================
    halls: {
      type: [HallSchema],
      default: [],
    },

    // =========================
    // Parking Information
    // =========================
    parking: {
      type: ParkingSchema,
      default: {},
    },

    // =========================
    // Accommodation / Hotels
    // =========================
    accommodation: {
      type: [AccommodationSchema],
      default: [],
    },

    // =========================
    // Transportation
    // =========================
    transportation: {
      type: [TransportationSchema],
      default: [],
    },

    // =========================
    // Nearby Facilities
    // =========================
    nearbyFacilities: {
      type: [NearbyFacilitySchema],
      default: [],
    },

    // =========================
    // Status
    // =========================
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: [true, 'Status is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// =========================
// Indexes
// =========================

AppVenueSchema.index({
  eventId: 1,
  status: 1,
})

AppVenueSchema.index({
  eventId: 1,
  venueName: 1,
})

export default mongoose.models.AppVenue ||
  mongoose.model('AppVenue', AppVenueSchema)
