import mongoose from 'mongoose'

const OrganizerTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    organizerType: {
      type: String,
      required: [true, 'Organizer Type is required'],
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

export default mongoose.models.OrganizerType ||
  mongoose.model('OrganizerType', OrganizerTypeSchema)
