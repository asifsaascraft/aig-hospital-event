import Poll from "../models/Poll.js";
import Event from "../models/Event.js";

// =======================
// Create Poll (EventAdmin)
// =======================
export const createPoll = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { pollQuestions } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const poll = await Poll.create({
      eventId,
      pollQuestions,
    });

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: poll,
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

    const { pollQuestions } = req.body;

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    if (pollQuestions) {
      poll.pollQuestions = pollQuestions;
    }

    await poll.save();

    return res.status(200).json({
      success: true,
      message: "Poll updated successfully",
      data: poll,
    });
  } catch (error) {
    console.error(error);

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