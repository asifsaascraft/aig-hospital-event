import AssignProfile from "../models/AssignProfile.js";
import Event from "../models/Event.js";
import CardProfile from "../models/CardProfile.js";
import EventRegistration from "../models/EventRegistration.js";


// =======================
// ASSIGN Profile 
// =======================
export const assignProfile = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { cardProfileId, eventRegistrationId } = req.body;

    //  validation
    if (
      !cardProfileId ||
      !Array.isArray(eventRegistrationId) ||
      eventRegistrationId.length === 0
    ) {
      return res.status(400).json({
        message: "cardProfileId and non-empty eventRegistrationId array required",
      });
    }

    //  check event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    //  check card profile
    const profile = await CardProfile.findById(cardProfileId);
    if (!profile) return res.status(404).json({ message: "Card profile not found" });

    //  check registrations exist
    const registrations = await EventRegistration.find({
      _id: { $in: eventRegistrationId },
    });

    if (registrations.length !== eventRegistrationId.length) {
      return res.status(400).json({
        message: "Some event registrations are invalid",
      });
    }

    //  IMPORTANT: CHECK IF ALREADY ASSIGNED ANYWHERE
    const alreadyAssigned = await AssignProfile.find({
      eventId,
      eventRegistrationId: { $in: eventRegistrationId },
    });

    if (alreadyAssigned.length > 0) {
      const assignedIds = alreadyAssigned.flatMap((doc) =>
        doc.eventRegistrationId.map((id) => id.toString())
      );

      const duplicateIds = eventRegistrationId.filter((id) =>
        assignedIds.includes(id)
      );

      return res.status(400).json({
        success: false,
        message: "Some registrations already assigned to another profile",
        duplicateIds,
      });
    }

    //  UPSERT
    const assign = await AssignProfile.findOneAndUpdate(
      { eventId, cardProfileId },
      {
        $addToSet: {
          eventRegistrationId: { $each: eventRegistrationId },
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile assigned successfully",
      data: assign,
    });

  } catch (error) {
    console.error("Assign profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get all Assigned Profile
// =======================
export const getAssignedProfilesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await AssignProfile.find({ eventId })
      .populate("cardProfileId", "CardProfileName")
      .populate("eventRegistrationId", "prefix name email mobile regNum");

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Remove Assigned registration 
// =======================
export const removeAssignedRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationId } = req.body;

    const assign = await AssignProfile.findById(id);
    if (!assign) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assign.eventRegistrationId = assign.eventRegistrationId.filter(
      (item) => item.toString() !== registrationId
    );

    await assign.save();

    //  remove empty document
    if (assign.eventRegistrationId.length === 0) {
      await assign.deleteOne();
    }

    res.status(200).json({
      success: true,
      message: "Removed successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Reassign single registration to another profile
// =======================
export const reassignRegistrationProfile = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { registrationId, newCardProfileId } = req.body;

    if (!registrationId || !newCardProfileId) {
      return res.status(400).json({
        message: "registrationId and newCardProfileId are required",
      });
    }

    //  check event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    //  check new profile
    const newProfile = await CardProfile.findById(newCardProfileId);
    if (!newProfile) {
      return res.status(404).json({ message: "Card profile not found" });
    }

    //  CHECK IF ALREADY IN SAME PROFILE
    const existing = await AssignProfile.findOne({
      eventId,
      cardProfileId: newCardProfileId,
      eventRegistrationId: registrationId,
    });

    if (existing) {
      return res.status(400).json({
        message: "Registration already assigned to this profile",
      });
    }

    //  REMOVE FROM CURRENT PROFILE (ONLY ONE)
    await AssignProfile.updateOne(
      { eventId, eventRegistrationId: registrationId },
      {
        $pull: { eventRegistrationId: registrationId },
      }
    );

    //  ADD TO NEW PROFILE
    const updated = await AssignProfile.findOneAndUpdate(
      { eventId, cardProfileId: newCardProfileId },
      {
        $addToSet: { eventRegistrationId: registrationId },
      },
      { new: true, upsert: true }
    );

    //  OPTIONAL: REMOVE EMPTY DOCS
    await AssignProfile.deleteMany({
      eventId,
      eventRegistrationId: { $size: 0 },
    });

    return res.status(200).json({
      success: true,
      message: "Registration reassigned successfully",
      data: updated,
    });

  } catch (error) {
    console.error("Reassign error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};