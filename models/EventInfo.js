import mongoose from 'mongoose'

const EventInfoSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },

    welcomeMessage: {
      type: String,
      required: [true, 'Welcome message is required'],
      trim: true,
    },

    bannerImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.EventInfo ||
  mongoose.model('EventInfo', EventInfoSchema)
