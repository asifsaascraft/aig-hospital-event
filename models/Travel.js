import mongoose from 'mongoose'

const TravelSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRegistration',
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    idUpload: {
      type: String,
      required: [true, 'Identity document is required'],
      trim: true,
    },

    travelAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelAgent',
      required: true,
      index: true,
    },

    arrival: {
      fromCity: {
        type: String,
        required: [true, 'Arrival from city is required'],
        trim: true,
      },

      toCity: {
        type: String,
        required: [true, 'Arrival to city is required'],
        trim: true,
      },

      vehicleType: {
        type: String,
        enum: ['flight', 'train'],
        required: [true, 'Arrival vehicle type is required'],
      },

      vehicleNumber: {
        type: String,
        required: [true, 'Arrival flight / train number is required'],
        trim: true,
      },

      pickupPoint: {
        type: String,
        required: [true, 'Arrival pickup point is required'],
        trim: true,
      },

      pickupDateTime: {
        type: Date,
        required: [true, 'Arrival pickup date and time is required'],
      },

      dropOffPoint: {
        type: String,
        required: [true, 'Arrival drop off point is required'],
        trim: true,
      },
    },

    departure: {
      fromCity: {
        type: String,
        required: [true, 'Departure from city is required'],
        trim: true,
      },

      toCity: {
        type: String,
        required: [true, 'Departure to city is required'],
        trim: true,
      },

      vehicleType: {
        type: String,
        enum: ['flight', 'train'],
        required: [true, 'Departure vehicle type is required'],
      },

      vehicleNumber: {
        type: String,
        required: [true, 'Departure flight / train number is required'],
        trim: true,
      },

      pickupPoint: {
        type: String,
        required: [true, 'Departure pickup point is required'],
        trim: true,
      },

      pickupDateTime: {
        type: Date,
        required: [true, 'Departure pickup date and time is required'],
      },

      dropOffPoint: {
        type: String,
        required: [true, 'Departure drop off point is required'],
        trim: true,
      },
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsor',
      index: true,
    },

    createdBy: {
      type: String,
      enum: ['eventAdmin', 'sponsor'],
      default: 'eventAdmin',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// One travel record per registered delegate per event
TravelSchema.index(
  { eventId: 1, eventRegistrationId: 1 },
  { unique: true },
)

export default mongoose.models.Travel || mongoose.model('Travel', TravelSchema)
