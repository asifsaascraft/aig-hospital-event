import mongoose from "mongoose";

const AssignBoothToSponsorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sponsorBoothId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SponsorBooth",
      required: true,
    },
    //Array of ObjectId
    sponsorId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    }],
  },
  { timestamps: true }
);

export default mongoose.models.AssignBoothToSponsor ||
  mongoose.model("AssignBoothToSponsor", AssignBoothToSponsorSchema);
