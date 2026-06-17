import mongoose from 'mongoose'

const BadgeProfilePrivilegeSchema = new mongoose.Schema(
  {
    /**
     * EVENT
     */

    eventId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: 'Event',

      required: true,
    },

    /**
     * BADGE PROFILE
     */

    badgeProfileId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: 'CardProfile',

      required: true,
    },

    /**
     * SCAN TYPE
     */

    scanTypeId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: 'ScanType',

      required: true,
    },

    /**
     * ACCESS CONTROL
     */

    isAllowed: {
      type: Boolean,

      default: false,
    },

    /**
     * OPTIONAL NOTE
     */

    note: {
      type: String,

      trim: true,

      default: '',
    },

    /**
     * STATUS
     */

    status: {
      type: String,

      enum: ['Active', 'Inactive'],

      default: 'Active',
    },

    /**
     * SOFT DELETE
     */

    isDeleted: {
      type: Boolean,

      default: false,
    },
  },

  {
    timestamps: true,
  },
)

/**
 * PREVENT DUPLICATES
 */

BadgeProfilePrivilegeSchema.index(
  {
    eventId: 1,

    badgeProfileId: 1,

    scanTypeId: 1,
  },

  {
    unique: true,
  },
)

export default mongoose.models.BadgeProfilePrivilege ||
  mongoose.model('BadgeProfilePrivilege', BadgeProfilePrivilegeSchema)
