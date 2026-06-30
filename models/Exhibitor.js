import mongoose from "mongoose";

const ExhibitorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Exhibitor Name is required"],
    },

    stall: {
      type: String,
      required: [true, "Stall is required"],
    },

    hall: {
      type: String,
      required: [true, "Hall is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    image: {  // optional
      type: String, // store file path or URL
    },

    exhibitorTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorType",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true },
);

export default mongoose.models.Exhibitor ||
  mongoose.model("Exhibitor", ExhibitorSchema);
