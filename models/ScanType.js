import mongoose from 'mongoose'

const ScanTypeSchema = new mongoose.Schema(
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
     * DISPLAY NAME
     * Example:
     * Lunch Access
     * Dinner Entry
     * Kit Bag
     */

    scanType: {
      type: String,

      required: [true, 'Scan Type is required'],

      trim: true,
    },

    /**
     * UNIQUE CODE
     * Example:
     * LUNCH
     * DINNER
     * KITBAG
     */

    scanCode: {
      type: String,

      required: [true, 'Scan Code is required'],

      uppercase: true,

      trim: true,
    },

    /**
     * DESCRIPTION
     */

    description: {
      type: String,

      trim: true,

      default: '',
    },

    /**
     * SCAN MODE
     * single
     * multiple
     */

    scanMode: {
      type: String,

      enum: ['single', 'multiple'],

      default: 'single',

      required: true,
    },

    /**
     * RE-ENTRY
     */

    allowReEntry: {
      type: Boolean,

      default: false,
    },

    /**
     * SCAN TIME WINDOW
     */

    scanStartTime: {
      type: Date,

      default: null,
    },

    scanEndTime: {
      type: Date,

      default: null,
    },

    /**
     * STATUS
     */

    status: {
      type: String,

      enum: ['Active', 'Inactive'],

      default: 'Active',

      required: true,
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

ScanTypeSchema.index(
  {
    eventId: 1,

    scanCode: 1,
  },

  {
    unique: true,
  },
)

export default mongoose.models.ScanType ||
  mongoose.model('ScanType', ScanTypeSchema)
