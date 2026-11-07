import mongoose from 'mongoose'

const FeedbackQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
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

    order: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
)

// Automatically enforce rating and NPS boundaries.
FeedbackQuestionSchema.pre('validate', function () {
  if (this.type === 'rating') {
    this.minValue = 1
    this.maxValue = 5
  }

  if (this.type === 'nps') {
    this.minValue = 0
    this.maxValue = 10
  }
})

const ConferenceFeedbackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },

    questions: {
      type: [FeedbackQuestionSchema],
      default: [],
    },

    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.ConferenceFeedback ||
  mongoose.model('ConferenceFeedback', ConferenceFeedbackSchema)
