import mongoose from 'mongoose'

const SocialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['instagram', 'x', 'facebook', 'linkedin', 'youtube'],
      required: true,
    },

    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
)

const SpeakerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },

    speakerTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpeakerType',
      required: [true, 'Speaker Type ID is required'],
    },

    name: {
      type: String,
      required: [true, 'Speaker Name is required'],
      trim: true,
    },

    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      required: [true, 'Status is required'],
    },

    // Optional
    biography: {
      type: String,
      trim: true,
    },

    // Optional
    affiliation: {
      type: String,
      trim: true,
    },

    // Optional
    speakerProfileImage: {
      type: String,
      trim: true,
    },

    // Optional - speaker can have multiple social links
    socialLinks: {
      type: [SocialLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Speaker ||
  mongoose.model('Speaker', SpeakerSchema)
