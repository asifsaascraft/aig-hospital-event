import mongoose from "mongoose";

const AccompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
    },
    accompanies: [
      {
        fullName: {
          type: String,
          required: [true, "Full Name is required"],
          trim: true,
        },
        relation: {
          type: String,
          required: [true, "Relation is required"],
          trim: true,
        },
        gender: {
          type: String,
          required: [true, "Gender is required"],
          trim: true,
        },
        age: {
          type: Number,
          required: [true, "Age is required"],
        },
        mealPreference: {
          type: String,
          required: [true, "Meal Preference is required"],
          trim: true,
        },
        isPaid: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// Avoid model overwrite during hot-reload
export default mongoose.models.Accompany ||
  mongoose.model("Accompany", AccompanySchema);
