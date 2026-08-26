import mongoose from "mongoose";

const PollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    poll: {
      pollTitle: {
        type: String,
        required: [true, "Poll Title is required"],
        trim: true,
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      selectionType: {
        type: String,
        enum: ["single", "multiple"],
        default: "single",
        required: [true, "Selection Type is required"],
      },

      minSelections: {
        type: Number,
        min: [1, "Minimum selections must be at least 1"],
        default: 1,
      },

      maxSelections: {
        type: Number,
        min: [1, "Maximum selections must be at least 1"],
        default: null,
      },

      status: {
        type: String,
        enum: ["draft", "scheduled", "active", "closed"],
        default: "draft",
      },

      startDateTime: {
        type: Date,
        required: [true, "Start Date time is required"],
      },

      endDateTime: {
        type: Date,
        required: [true, "End Date Time is required"],
      },

      allowVoteChange: {
        type: Boolean,
        default: false,
      },

      displayOrder: {
        type: Number,
        default: 0,
      },

      options: [
        {
          optionText: {
            type: String,
            required: [true, "Option text is required"],
            trim: true,
          },

          displayOrder: {
            type: Number,
            default: 0,
          },

          isActive: {
            type: Boolean,
            default: true,
          },

          voteCount: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

// Ensure multiple-selection configuration is logically valid.
PollSchema.pre("validate", function (next) {
  const poll = this.poll;

  if (!poll) {
    return next();
  }

  if (poll.selectionType === "single") {
    poll.minSelections = 1;
    poll.maxSelections = 1;
  }

  if (
    poll.selectionType === "multiple" &&
    poll.maxSelections !== null &&
    poll.maxSelections < poll.minSelections
  ) {
    return next(
      new Error(
        "Maximum selections must be greater than or equal to minimum selections",
      ),
    );
  }

  if (
    poll.options &&
    poll.options.length > 0 &&
    poll.maxSelections !== null &&
    poll.maxSelections > poll.options.length
  ) {
    poll.maxSelections = poll.options.length;
  }

  next();
});

export default mongoose.models.Poll ||
  mongoose.model("Poll", PollSchema);
