import mongoose from "mongoose";

const MarketingTeamTravelSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    marketingTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingTeam",
      required: true,
    },
    travelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Travel",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.MarketingTeamTravel ||
  mongoose.model("MarketingTeamTravel", MarketingTeamTravelSchema);