import mongoose from 'mongoose'

const AppQuizSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    quizName: {
      type: String,
      required: [true, 'Quiz Name is required'],
      trim: true,
    },

    quizDescription: {
      type: String,
      trim: true,
      default: '',
    },

    quizLink: {
      type: String,
      required: [true, 'Quiz Link is required'],
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

export default mongoose.models.AppQuiz ||
  mongoose.model('AppQuiz', AppQuizSchema)
