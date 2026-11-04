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

const OrganizerMemberSchema = new mongoose.Schema(
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
    // Organizer Type
    // =========================
    organizerTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizerType',
      required: true,
      index: true,
    },

    // =========================
    // Organizer Information
    // =========================
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    affiliation: {
      type: String,
      trim: true,
    },

    aboutOrganizer: {
      type: String,
      trim: true,
    },

    // =========================
    // Contact Information
    // =========================
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    // =========================
    // Social Media
    // =========================
    socialLinks: {
      type: [SocialLinkSchema],
      default: [],
    },

    // =========================
    // Profile Image
    // =========================
    organizerProfileImage: {
      type: String,
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
      min: 1,
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

OrganizerMemberSchema.index({
  eventId: 1,
  status: 1,
})

OrganizerMemberSchema.index({
  eventId: 1,
  organizerTypeId: 1,
})

OrganizerMemberSchema.index({
  eventId: 1,
  featured: 1,
  featuredOrder: 1,
})

OrganizerMemberSchema.index({
  eventId: 1,
  name: 1,
})

export default mongoose.models.OrganizerMember ||
  mongoose.model('OrganizerMember', OrganizerMemberSchema)
