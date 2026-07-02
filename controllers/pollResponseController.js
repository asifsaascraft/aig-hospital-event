import Poll from "../models/Poll.js";
import PollResponse from "../models/PollResponse.js";
import Event from "../models/Event.js";

// =======================
// Submit Poll Response (User)
// =======================
export const submitPollResponse = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { pollId, selectedOptions } = req.body;

    const userId = req.user._id;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // =======================
    // Validate Poll
    // =======================
    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    // =======================
    // Poll Start / End Validation
    // =======================
    const currentDate = new Date();

    if (currentDate < poll.poll.startDateTime) {
      return res.status(400).json({
        success: false,
        message: "Poll has not started yet",
      });
    }

    if (currentDate > poll.poll.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Poll has already ended",
      });
    }

    // =======================
    // Already Submitted?
    // =======================
    const alreadySubmitted = await PollResponse.findOne({
      pollId,
      userId,
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this poll",
      });
    }

    // =======================
    // Validate selectedOptions
    // =======================
    if (
      !selectedOptions ||
      !Array.isArray(selectedOptions) ||
      selectedOptions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one option",
      });
    }

    // =======================
    // Single Poll Validation
    // =======================
    if (poll.poll.pollType === "Single" && selectedOptions.length > 1) {
      return res.status(400).json({
        success: false,
        message: "Only one option can be selected",
      });
    }

    // =======================
    // Validate Option IDs
    // =======================
    const validOptionIds = poll.poll.options.map((option) =>
      option._id.toString(),
    );

    const invalidOption = selectedOptions.find(
      (id) => !validOptionIds.includes(id.toString()),
    );

    if (invalidOption) {
      return res.status(400).json({
        success: false,
        message: "One or more selected options are invalid",
      });
    }

    // =======================
    // Save Response
    // =======================
    const response = await PollResponse.create({
      eventId,
      pollId,
      userId,
      selectedOptions,
      isSubmitted: true,
    });

    return res.status(201).json({
      success: true,
      message: "Poll submitted successfully",
      data: response,
    });
  } catch (error) {
    console.error("Submit Poll Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this poll",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get Poll Result (User)
// =======================
export const getPollResult = async (req, res) => {
  try {
    const { eventId, pollId } = req.params;

    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    const responses = await PollResponse.find({
      eventId,
      pollId,
      isSubmitted: true,
    });

    const totalVotes = responses.length;

    const result = poll.poll.options.map((option) => {
      let votes = 0;

      responses.forEach((response) => {
        if (
          response.selectedOptions.some(
            (id) => id.toString() === option._id.toString(),
          )
        ) {
          votes++;
        }
      });

      return {
        optionId: option._id,
        option: option.optionText,
        votes,
        percentage:
          totalVotes === 0
            ? 0
            : Number(((votes / totalVotes) * 100).toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        pollId: poll._id,
        pollTitle: poll.poll.pollTitle,
        pollType: poll.poll.pollType,
        totalVotes,
        result,
      },
    });
  } catch (error) {
    console.error("Get Poll Result Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get All My Poll Responses by event (User)
// =======================
export const getMyPollResponse = async (req, res) => {
  try {
    const { eventId, pollId } = req.params;

    const userId = req.user._id;

    const response = await PollResponse.findOne({
      eventId,
      pollId,
      userId,
    });

    return res.status(200).json({
      success: true,
      submitted: !!response,
      data: response,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get All Responses By Poll (Public)
// =======================
export const getPollResponsesByPoll = async (req, res) => {
  try {
    const { eventId, pollId } = req.params;

    const poll = await Poll.findOne({
      _id: pollId,
      eventId,
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    const responses = await PollResponse.find({
      eventId,
      pollId,
      isSubmitted: true,
    })
      .populate("userId", "name email mobile")
      .sort({
        createdAt: -1,
      });

    const formattedResponses = responses.map((response) => ({
      _id: response._id,

      user: response.userId,

      selectedOptions: response.selectedOptions.map((selectedId) => {
        const option = poll.poll.options.find(
          (opt) => opt._id.toString() === selectedId.toString(),
        );

        return {
          optionId: selectedId,
          optionText: option ? option.optionText : "",
        };
      }),

      submittedAt: response.createdAt,
    }));

    return res.status(200).json({
      success: true,
      pollTitle: poll.poll.pollTitle,
      totalResponses: formattedResponses.length,
      data: formattedResponses,
    });
  } catch (error) {
    console.error("Get Poll Responses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get Poll Summary By Event
// (Public)
// =======================
export const getPollSummaryByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const polls = await Poll.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    const summary = [];

    for (const poll of polls) {
      const responses = await PollResponse.find({
        eventId,
        pollId: poll._id,
        isSubmitted: true,
      });

      const totalVotes = responses.length;

      const optionsSummary = poll.poll.options.map((option) => {
        let votes = 0;

        responses.forEach((response) => {
          if (
            response.selectedOptions.some(
              (id) => id.toString() === option._id.toString(),
            )
          ) {
            votes++;
          }
        });

        return {
          optionId: option._id,

          optionText: option.optionText,

          votes,

          percentage:
            totalVotes === 0
              ? 0
              : Number(((votes / totalVotes) * 100).toFixed(2)),
        };
      });

      summary.push({
        pollId: poll._id,

        pollTitle: poll.poll.pollTitle,

        pollType: poll.poll.pollType,

        startDateTime: poll.poll.startDateTime,

        endDateTime: poll.poll.endDateTime,

        totalVotes,

        options: optionsSummary,
      });
    }

    return res.status(200).json({
      success: true,
      totalPolls: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Poll Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get All count Poll Responses By Event (Public)
// =======================
export const getPollResponseCount = async (
  req,
  res
) => {
  try {
    const { eventId, pollId } = req.params;

    const totalResponses =
      await PollResponse.countDocuments({
        eventId,
        pollId,
        isSubmitted: true,
      });

    return res.status(200).json({
      success: true,
      totalResponses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};