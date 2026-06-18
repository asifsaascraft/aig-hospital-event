import mongoose from 'mongoose'

const { Schema } = mongoose

const OnsiteBadgeSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    // source tracking
    sourceType: {
      type: String,
      enum: [
        'registration',
        'accompany',
        'sponsor_csv',
        'manual',
      ],
      required: true,
      index: true,
    },

    sourceId: {
      type: String,
      default: null,
    },

    // attendee info
    prefix: {
      type: String,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    gender: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    affiliation: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    mciNumber: {
      type: String,
      trim: true,
    },

    mciState: {
      type: String,
      trim: true,
    },

    // registration
    regNum: {
      type: String,
      unique: true,
      sparse: true,
    },

    registrationType: {
      type: String,
      trim: true,
    },

    // badge profile
    badgeProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'CardProfile',
      default: null,
    },

    badgeProfileName: {
      type: String,
      trim: true,
      index: true,
    },

    // sponsor
    sponsorId: {
      type: Schema.Types.ObjectId,
      ref: 'Sponsor',
      default: null,
    },

    sponsorName: {
      type: String,
      trim: true,
      index: true,
    },

    // relations
    parentRegistrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      default: null,
    },

    // import info
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    importBatchId: {
      type: String,
      default: null,
    },

    // print management
    badgePrinted: {
      type: Boolean,
      default: false,
      index: true,
    },

    printCount: {
      type: Number,
      default: 0,
    },

    lastPrintedAt: {
      type: Date,
      default: null,
    },

    printLogs: [
      {
        printedAt: {
          type: Date,
          required: true,
        },

        printedBy: {
          type: Schema.Types.ObjectId,
          ref: 'Admin',
          default: null,
        },

        reason: {
          type: String,
          trim: true,
        },
      },
    ],

    // duplicate prevention
    uniqueCompositeKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // status
    isPaid: {
      type: Boolean,
      default: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
    },
    bulkEmailSent: {
      type: Boolean,
      default: false,
    },

    bulkEmailSentAt: {
      type: Date,
      default: null,
    },

    singleEmailSent: {
      type: Boolean,
      default: false,
    },

    singleEmailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

/**
 * SEARCH INDEX
 */

OnsiteBadgeSchema.index({
  name: 'text',
  email: 'text',
  mobile: 'text',
  regNum: 'text',
})

/**
 * FILTER INDEXES
 */

OnsiteBadgeSchema.index({
  eventId: 1,
  sourceType: 1,
})

OnsiteBadgeSchema.index({
  eventId: 1,
  badgePrinted: 1,
})

OnsiteBadgeSchema.index({
  eventId: 1,
  sponsorName: 1,
})

OnsiteBadgeSchema.index({
  eventId: 1,
  badgeProfileName: 1,
})

export default mongoose.models.OnsiteBadge ||
  mongoose.model('OnsiteBadge', OnsiteBadgeSchema)
