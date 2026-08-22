import mongoose from 'mongoose'

const EventInfoSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
      index: true,
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
