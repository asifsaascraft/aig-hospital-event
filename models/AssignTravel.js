import mongoose from "mongoose";

const AssignTravelSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    marketingTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingTeam",
    },

    eventAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    otherTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OtherTeam",
    },

    travelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Travel",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

//  Enforce ONLY ONE TEAM
AssignTravelSchema.pre("validate", function (next) {
  const count = [
    this.marketingTeamId,
    this.eventAdminId,
    this.otherTeamId,
  ].filter(Boolean).length;

  if (count !== 1) {
    return next(
      new Error(
        "Exactly one of marketingTeamId, eventAdminId, otherTeamId is required"
      )
    );
  }

  next();
});

export default mongoose.models.AssignTravel ||
  mongoose.model("AssignTravel", AssignTravelSchema);