import Poll from "../models/Poll.js";
import Event from "../models/Event.js";


// =======================
// Create Poll (EventAdmin)
// =======================
export const createPoll = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { poll } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const pollData = {
      eventId,
      poll,
    };

    // =======================
    // Date Validation
    // =======================

    if (
      pollData.poll.startDateTime &&
      isNaN(new Date(pollData.poll.startDateTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (
      pollData.poll.endDateTime &&
      isNaN(new Date(pollData.poll.endDateTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Convert Dates

    if (pollData.poll.startDateTime) {
      pollData.poll.startDateTime = new Date(
        pollData.poll.startDateTime
      );
    }

    if (pollData.poll.endDateTime) {
      pollData.poll.endDateTime = new Date(
        pollData.poll.endDateTime
      );
    }

    // Validate Range

    if (
      pollData.poll.startDateTime &&
      pollData.poll.endDateTime &&
      pollData.poll.endDateTime <
        pollData.poll.startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date time must be greater than start date time",
      });
    }

    const newPoll = await Poll.create(pollData);

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: newPoll,
    });
  } catch (error) {
    console.error("Create Poll Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
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

    const polls = await Poll.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Polls fetched successfully",
      data: polls,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
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
        message: "Poll not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Poll fetched successfully",
      data: poll,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
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

    const existingPoll = await Poll.findById(id);

    if (!existingPoll) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    if (poll) {
      // Validate Dates

      if (
        poll.startDateTime &&
        isNaN(new Date(poll.startDateTime))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid startDateTime format",
        });
      }

      if (
        poll.endDateTime &&
        isNaN(new Date(poll.endDateTime))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid endDateTime format",
        });
      }

      const finalStartDateTime = poll.startDateTime
        ? new Date(poll.startDateTime)
        : existingPoll.poll.startDateTime;

      const finalEndDateTime = poll.endDateTime
        ? new Date(poll.endDateTime)
        : existingPoll.poll.endDateTime;

      if (finalEndDateTime < finalStartDateTime) {
        return res.status(400).json({
          success: false,
          message:
            "End date time must be greater than start date time",
        });
      }

      existingPoll.poll = {
        ...existingPoll.poll.toObject(),
        ...poll,
        startDateTime: finalStartDateTime,
        endDateTime: finalEndDateTime,
      };
    }

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
        (err) => err.message
      );

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
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
        message: "Poll not found",
      });
    }

    await poll.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Poll deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};