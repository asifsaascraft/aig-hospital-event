
import Poll from "../models/Poll.js";
import Event from "../models/Event.js";

// =======================
// Helper: Validate Dates
// =======================
const validatePollDates = (startDateTime, endDateTime) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isNaN(start.getTime())) {
    return {
      valid: false,
      message: "Invalid startDateTime format",
    };
  }

  if (isNaN(end.getTime())) {
    return {
      valid: false,
      message: "Invalid endDateTime format",
    };
  }

  if (end <= start) {
    return {
      valid: false,
      message: "End date time must be greater than start date time",
    };
  }

  return {
    valid: true,
    start,
    end,
  };
};

// =======================
// Helper: Validate Poll Configuration
// =======================
const validatePollConfiguration = (poll) => {
  if (!poll) {
    return {
      valid: false,
      message: "Poll data is required",
    };
  }

  const {
    selectionType,
    minSelections,
    maxSelections,
    options,
  } = poll;

  // =======================
  // Selection Type
  // =======================
  if (!["single", "multiple"].includes(selectionType)) {
    return {
      valid: false,
      message: "Selection type must be either single or multiple",
    };
  }

  // =======================
  // Options
  // =======================
  if (!Array.isArray(options) || options.length < 2) {
    return {
      valid: false,
      message: "Poll must have at least two options",
    };
  }

  // =======================
  // Validate Option Text
  // =======================
  const normalizedOptions = options.map((option) =>
    String(option.optionText || "")
      .trim()
      .toLowerCase(),
  );

  const hasDuplicateOptions =
    new Set(normalizedOptions).size !== normalizedOptions.length;

  if (hasDuplicateOptions) {
    return {
      valid: false,
      message: "Poll options must be unique",
    };
  }

  // =======================
  // Single Selection
  // =======================
  if (selectionType === "single") {
    if (minSelections !== undefined && minSelections !== 1) {
      return {
        valid: false,
        message: "Single selection polls must have minimum selections set to 1",
      };
    }

    if (
      maxSelections !== undefined &&
      maxSelections !== null &&
      maxSelections !== 1
    ) {
      return {
        valid: false,
        message: "Single selection polls must have maximum selections set to 1",
      };
    }
  }

  // =======================
  // Multiple Selection
  // =======================
  if (selectionType === "multiple") {
    const min = minSelections ?? 1;
    const max = maxSelections ?? null;

    if (min < 1) {
      return {
        valid: false,
        message: "Minimum selections must be at least 1",
      };
    }

    if (max !== null && max < 1) {
      return {
        valid: false,
        message: "Maximum selections must be at least 1",
      };
    }

    if (max !== null && max < min) {
      return {
        valid: false,
        message:
          "Maximum selections must be greater than or equal to minimum selections",
      };
    }

    if (min > options.length) {
      return {
        valid: false,
        message:
          "Minimum selections cannot be greater than the number of options",
      };
    }

    if (max !== null && max > options.length) {
      return {
        valid: false,
        message:
          "Maximum selections cannot be greater than the number of options",
      };
    }
  }

  return {
    valid: true,
  };
};

// =======================
// Helper: Normalize Poll Data
// =======================
const normalizePollData = (poll) => {
  const normalizedPoll = {
    ...poll,
  };

  // =======================
  // Selection Type
  // =======================
  normalizedPoll.selectionType =
    normalizedPoll.selectionType === "multiple"
      ? "multiple"
      : "single";

  // =======================
  // Single Selection Defaults
  // =======================
  if (normalizedPoll.selectionType === "single") {
    normalizedPoll.minSelections = 1;
    normalizedPoll.maxSelections = 1;
  }

  // =======================
  // Multiple Selection Defaults
  // =======================
  if (normalizedPoll.selectionType === "multiple") {
    normalizedPoll.minSelections =
      normalizedPoll.minSelections ?? 1;

    normalizedPoll.maxSelections =
      normalizedPoll.maxSelections ?? null;
  }

  // =======================
  // Options
  // =======================
  if (Array.isArray(normalizedPoll.options)) {
    normalizedPoll.options = normalizedPoll.options.map(
      (option, index) => ({
        ...option,
        optionText: String(option.optionText || "").trim(),
        displayOrder:
          typeof option.displayOrder === "number"
            ? option.displayOrder
            : index,
        isActive:
          typeof option.isActive === "boolean"
            ? option.isActive
            : true,
        voteCount:
          typeof option.voteCount === "number"
            ? option.voteCount
            : 0,
      }),
    );
  }

  // =======================
  // Poll Display Order
  // =======================
  if (typeof normalizedPoll.displayOrder !== "number") {
    normalizedPoll.displayOrder = 0;
  }

  // =======================
  // Status
  // =======================
  if (!normalizedPoll.status) {
    normalizedPoll.status = "draft";
  }

  // =======================
  // Vote Change
  // =======================
  if (typeof normalizedPoll.allowVoteChange !== "boolean") {
    normalizedPoll.allowVoteChange = false;
  }

  // =======================
  // Description
  // =======================
  if (typeof normalizedPoll.description !== "string") {
    normalizedPoll.description = "";
  }

  return normalizedPoll;
};

// =======================
// Helper: Get Effective Poll Status
// =======================
const getEffectivePollStatus = (poll) => {
  const now = new Date();

  if (poll.status === "draft") {
    return "draft";
  }

  if (poll.status === "closed") {
    return "closed";
  }

  if (now < poll.startDateTime) {
    return "scheduled";
  }

  if (now > poll.endDateTime) {
    return "closed";
  }

  return "active";
};

// =======================
// Create Poll (EventAdmin)
// =======================
export const createPoll = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { poll } = req.body;

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =======================
    // Validate Poll Data
    // =======================
    if (!poll) {
      return res.status(400).json({
        success: false,
        message: "Poll data is required",
      });
    }

    // =======================
    // Normalize Poll
    // =======================
    const normalizedPoll = normalizePollData(poll);

    // =======================
    // Validate Configuration
    // =======================
    const configurationValidation =
      validatePollConfiguration(normalizedPoll);

    if (!configurationValidation.valid) {
      return res.status(400).json({
        success: false,
        message: configurationValidation.message,
      });
    }

    // =======================
    // Date Validation
    // =======================
    const dateValidation = validatePollDates(
      normalizedPoll.startDateTime,
      normalizedPoll.endDateTime,
    );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message,
      });
    }

    normalizedPoll.startDateTime = dateValidation.start;
    normalizedPoll.endDateTime = dateValidation.end;

    // =======================
    // Determine Initial Status
    // =======================
    if (normalizedPoll.status !== "draft") {
      const now = new Date();

      if (now < normalizedPoll.startDateTime) {
        normalizedPoll.status = "scheduled";
      } else if (now > normalizedPoll.endDateTime) {
        normalizedPoll.status = "closed";
      } else {
        normalizedPoll.status = "active";
      }
    }

    // =======================
    // Create Poll
    // =======================
    const newPoll = await Poll.create({
      eventId,
      poll: normalizedPoll,
    });

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: newPoll,
    });
  } catch (error) {
    console.error("Create Poll Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(
        (err) => err.message,
      );

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get All Polls By Event
// =======================
export const getPollsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // =======================
    // Validate Event
    // =======================
    const event = await Event.findById(eventId).select("_id");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =======================
    // Fetch Polls
    // =======================
    const polls = await Poll.find({
      eventId,
    }).sort({
      "poll.displayOrder": 1,
      createdAt: -1,
    });

    // =======================
    // Add Effective Status
    // =======================
    const formattedPolls = polls.map((poll) => {
      const pollObject = poll.toObject();

      pollObject.poll.effectiveStatus =
        getEffectivePollStatus(pollObject.poll);

      return pollObject;
    });

    return res.status(200).json({
      success: true,
      message: "Polls fetched successfully",
      data: formattedPolls,
    });
  } catch (error) {
    console.error("Get Polls By Event Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get Poll By Id
// =======================
export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    const pollObject = poll.toObject();

    pollObject.poll.effectiveStatus =
      getEffectivePollStatus(pollObject.poll);

    return res.status(200).json({
      success: true,
      message: "Poll fetched successfully",
      data: pollObject,
    });
  } catch (error) {
    console.error("Get Poll By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Update Poll
// =======================
export const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { poll } = req.body;

    // =======================
    // Validate Existing Poll
    // =======================
    const existingPoll = await Poll.findById(id);

    if (!existingPoll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    if (!poll) {
      return res.status(400).json({
        success: false,
        message: "Poll data is required",
      });
    }

    // =======================
    // Prevent Unsafe Vote Count Changes
    // =======================
    const existingOptions =
      existingPoll.poll.options || [];

    const incomingOptions = Array.isArray(poll.options)
      ? poll.options
      : existingOptions;

    const existingOptionMap = new Map(
      existingOptions.map((option) => [
        option._id.toString(),
        option,
      ]),
    );

    // =======================
    // Normalize Incoming Poll
    // =======================
    const mergedPoll = {
      ...existingPoll.poll.toObject(),
      ...poll,
      options: incomingOptions,
    };

    const normalizedPoll = normalizePollData(mergedPoll);

    // =======================
    // Date Validation
    // =======================
    const dateValidation = validatePollDates(
      normalizedPoll.startDateTime,
      normalizedPoll.endDateTime,
    );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message,
      });
    }

    normalizedPoll.startDateTime = dateValidation.start;
    normalizedPoll.endDateTime = dateValidation.end;

    // =======================
    // Validate Configuration
    // =======================
    const configurationValidation =
      validatePollConfiguration(normalizedPoll);

    if (!configurationValidation.valid) {
      return res.status(400).json({
        success: false,
        message: configurationValidation.message,
      });
    }

    // =======================
    // Preserve Existing Vote Counts
    // =======================
    normalizedPoll.options = normalizedPoll.options.map(
      (option, index) => {
        const optionId = option._id?.toString();

        const existingOption = optionId
          ? existingOptionMap.get(optionId)
          : null;

        return {
          ...option,

          displayOrder:
            typeof option.displayOrder === "number"
              ? option.displayOrder
              : index,

          isActive:
            typeof option.isActive === "boolean"
              ? option.isActive
              : true,

          voteCount: existingOption
            ? existingOption.voteCount || 0
            : 0,
        };
      },
    );

    // =======================
    // Protect Poll With Existing Responses
    // =======================
    if (
      existingPoll.poll.status === "active" ||
      existingPoll.poll.status === "closed"
    ) {
      // Do not allow changing the selection model
      // after voting has started.
      if (
        poll.selectionType &&
        poll.selectionType !== existingPoll.poll.selectionType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selection type cannot be changed after the poll has started",
        });
      }

      // Do not allow changing option IDs that already
      // have recorded votes.
      for (const existingOption of existingOptions) {
        const existingVoteCount =
          existingOption.voteCount || 0;

        if (existingVoteCount <= 0) {
          continue;
        }

        const optionStillExists = normalizedPoll.options.some(
          (option) =>
            option._id &&
            option._id.toString() ===
              existingOption._id.toString(),
        );

        if (!optionStillExists) {
          return res.status(400).json({
            success: false,
            message:
              "Options with existing votes cannot be removed",
          });
        }
      }
    }

    // =======================
    // Determine Status
    // =======================
    if (poll.status) {
      if (
        ![
          "draft",
          "scheduled",
          "active",
          "closed",
        ].includes(poll.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be draft, scheduled, active, or closed",
        });
      }

      normalizedPoll.status = poll.status;
    } else {
      const currentStatus = existingPoll.poll.status;

      if (currentStatus === "draft") {
        normalizedPoll.status = "draft";
      } else if (currentStatus === "closed") {
        normalizedPoll.status = "closed";
      } else {
        const now = new Date();

        if (now < normalizedPoll.startDateTime) {
          normalizedPoll.status = "scheduled";
        } else if (now > normalizedPoll.endDateTime) {
          normalizedPoll.status = "closed";
        } else {
          normalizedPoll.status = "active";
        }
      }
    }

    // =======================
    // Save
    // =======================
    existingPoll.poll = normalizedPoll;

    await existingPoll.save();

    return res.status(200).json({
      success: true,
      message: "Poll updated successfully",
      data: existingPoll,
    });
  } catch (error) {
    console.error("Update Poll Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(
        (err) => err.message,
      );

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Delete Poll
// =======================
export const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    // =======================
    // Protect Active Polls
    // =======================
    const effectiveStatus = getEffectivePollStatus(
      poll.poll,
    );

    if (effectiveStatus === "active") {
      return res.status(400).json({
        success: false,
        message: "Active polls cannot be deleted",
      });
    }

    await poll.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Poll deleted successfully",
    });
  } catch (error) {
    console.error("Delete Poll Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
