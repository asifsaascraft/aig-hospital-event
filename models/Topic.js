import mongoose from 'mongoose'

const TopicParticipantSchema = new mongoose.Schema(
  {
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      required: [true, 'Speaker is required'],
    },

    role: {
      type: String,
      enum: [
        'Speaker',
        'Chairperson',
        'Co-Chairperson',
        'Moderator',
        'Panelist',
        'Quiz Master',
        'Team Member',
      ],
      required: [true, 'Participant role is required'],
    },
  },
  { _id: false },
)

const TopicSchema = new mongoose.Schema(
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
    // Session
    // =========================
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },

    // =========================
    // Topic Type
    // =========================
    topicType: {
      type: String,
      enum: ['Presentation', 'Panel Discussion', 'Quiz', 'Debate'],
      required: [true, 'Topic Type is required'],
      trim: true,
    },

    // =========================
    // Topic Information
    // =========================
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    aboutTopic: {
      type: String,
      trim: true,
      default: '',
    },

    // =========================
    // Topic Schedule
    // =========================
    startDateTime: {
      type: Date,
      required: [true, 'Start date time is required'],
    },

    endDateTime: {
      type: Date,
      required: [true, 'End date time is required'],
    },

    // =========================
    // Participants
    // =========================
    participants: {
      type: [TopicParticipantSchema],
      default: [],
    },

    // =========================
    // Visibility
    // =========================
    featured: {
      type: Boolean,
      default: false,
    },

    featuredOrder: {
      type: Number,
      default: null,
      min: [1, 'Featured order must be at least 1'],
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

TopicSchema.index({
  eventId: 1,
  sessionId: 1,
})

TopicSchema.index({
  sessionId: 1,
  startDateTime: 1,
})

TopicSchema.index({
  eventId: 1,
  status: 1,
})

TopicSchema.index({
  eventId: 1,
  featured: 1,
  featuredOrder: 1,
})

// =========================
// Date Validation
// =========================

TopicSchema.pre('validate', function (next) {
  if (
    this.startDateTime &&
    this.endDateTime &&
    this.endDateTime < this.startDateTime
  ) {
    this.invalidate(
      'endDateTime',
      'End date time must be greater than or equal to start date time',
    )
  }

  next()
})

export default mongoose.models.Topic || mongoose.model('Topic', TopicSchema)

