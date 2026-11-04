import mongoose from 'mongoose'

const AppPollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    pollName: {
      type: String,
      required: [true, 'Poll Name is required'],
      trim: true,
    },

    pollDescription: {
      type: String,
      trim: true,
      default: '',
    },

    pollLink: {
      type: String,
      required: [true, 'Poll Link is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: [true, 'Status is required'],
    },
  },
  { timestamps: true },
)

export default mongoose.models.AppPoll ||
  mongoose.model('AppPoll', AppPollSchema)
