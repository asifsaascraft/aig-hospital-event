import mongoose from 'mongoose'

const PollResponseSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    selectedOptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    ],

    isSubmitted: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// One user can have only one response for one poll.
PollResponseSchema.index(
  {
    pollId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
)

// Useful for event-level poll analytics.
PollResponseSchema.index({
  eventId: 1,
  pollId: 1,
  isSubmitted: 1,
})

export default mongoose.models.PollResponse ||
  mongoose.model('PollResponse', PollResponseSchema)
