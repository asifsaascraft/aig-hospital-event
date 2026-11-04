import mongoose from 'mongoose'

const FeedbackAnswerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        'rating',
        'text',
        'singleChoice',
        'multipleChoice',
        'yesNo',
        'nps',
      ],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
    },

    options: {
      type: [String],
      default: undefined,
    },

    minValue: {
      type: Number,
    },

    maxValue: {
      type: Number,
    },
  },
  {
    _id: false,
  },
)

const ConferenceFeedbackResponseSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConferenceFeedback',
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    answers: {
      type: [FeedbackAnswerSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

ConferenceFeedbackResponseSchema.index(
  { eventId: 1, userId: 1 },
  { unique: true },
)

export default mongoose.model(
  'ConferenceFeedbackResponse',
  ConferenceFeedbackResponseSchema,
)
