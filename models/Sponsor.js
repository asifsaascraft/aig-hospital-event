import mongoose from 'mongoose'

const SponsorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    sponsorName: {
      type: String,
      required: [true, 'Sponsor name is required'],
      trim: true,
    },

    contactPersonName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },

    additionalEmail: {
      type: String,
      trim: true,
    },

    /**
     * Event-specific Sponsor login credential.
     *
     * This token is generated automatically when a Sponsor
     * is created and is used as the Sponsor's only login credential.
     */
    loginToken: {
      type: String,
      required: [true, 'Login token is required'],
      unique: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
    },

    companyAddress: {
      type: String,
      required: [true, 'Company Address is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true },
)

/**
 * A Sponsor's email must be unique only within the same Event.
 *
 * This allows:
 *
 * Event A + sponsor@example.com  -> allowed
 * Event B + sponsor@example.com  -> allowed
 *
 * But:
 *
 * Event A + sponsor@example.com  -> duplicate
 */
SponsorSchema.index({ eventId: 1, email: 1 }, { unique: true })

/**
 * loginToken is the Sponsor's login credential and must
 * identify only one Sponsor account.
 */
SponsorSchema.index({ loginToken: 1 }, { unique: true })

export default mongoose.models.Sponsor ||
  mongoose.model('Sponsor', SponsorSchema)
