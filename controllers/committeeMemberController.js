import CommitteeMember from "../models/CommitteeMember.js";
import CommitteeType from "../models/CommitteeType.js";
import Event from "../models/Event.js";

// =======================
// Create Committee Member (EventAdmin)
// =======================
export const createCommitteeMember = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      name,
      designation,
      committeeTypeId,
      status,
    } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Validate Committee Type
    const committeeType = await CommitteeType.findById(
      committeeTypeId
    );

    if (!committeeType) {
      return res.status(404).json({
        message: "Committee Type not found",
      });
    }

    let image = "";

    if (req.file) {
      image = req.file.location;
    }

    const member = await CommitteeMember.create({
      eventId,
      name,
      designation,
      committeeTypeId,
      images: image,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Committee Member created successfully",
      data: member,
    });
  } catch (error) {
    console.error("Create Committee Member Error:", error);

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
// Get All Committee Members By Event
// =======================
export const getCommitteeMembersByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const members = await CommitteeMember.find({
      eventId,
    })
      .populate(
        "committeeTypeId",
        "committeeType status"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message:
        "Committee Members fetched successfully",
      data: members,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Committee Members
// =======================
export const getActiveCommitteeMembersByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const members = await CommitteeMember.find({
        eventId,
        status: "Active",
      })
        .populate(
          "committeeTypeId",
          "committeeType status"
        )
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        message:
          "Active Committee Members fetched successfully",
        data: members,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Get Committee Member By Id
// =======================
export const getCommitteeMemberById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const member =
      await CommitteeMember.findById(id).populate(
        "committeeTypeId",
        "committeeType status"
      );

    if (!member) {
      return res.status(404).json({
        message: "Committee Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Committee Member fetched successfully",
      data: member,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Committee Member
// =======================
export const updateCommitteeMember = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      designation,
      committeeTypeId,
      status,
    } = req.body;

    const member =
      await CommitteeMember.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Committee Member not found",
      });
    }

    if (committeeTypeId) {
      const committeeType =
        await CommitteeType.findById(
          committeeTypeId
        );

      if (!committeeType) {
        return res.status(404).json({
          message: "Committee Type not found",
        });
      }

      member.committeeTypeId = committeeTypeId;
    }

    if (name) member.name = name;

    if (designation)
      member.designation = designation;

    if (status) member.status = status;

    if (req.file) {
      member.images = req.file.location;
    }

    await member.save();

    return res.status(200).json({
      success: true,
      message:
        "Committee Member updated successfully",
      data: member,
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
// Delete Committee Member
// =======================
export const deleteCommitteeMember = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const member =
      await CommitteeMember.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Committee Member not found",
      });
    }

    await member.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Committee Member deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};