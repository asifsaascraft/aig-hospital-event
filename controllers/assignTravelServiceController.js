import AssignTravelService from "../models/AssignTravelService.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";
import EventRegistration from "../models/EventRegistration.js";
import Travel from "../models/Travel.js";

// =======================
// ASSIGN Travel Service
// =======================
export const assignTravelService = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, eventRegistrationId } = req.body;

    // validation
    if (
      !sponsorId ||
      !Array.isArray(eventRegistrationId) ||
      eventRegistrationId.length === 0
    ) {
      return res.status(400).json({
        message: "sponsorId and non-empty eventRegistrationId array required",
      });
    }

    // check event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // check sponsor
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    // check registrations
    const registrations = await EventRegistration.find({
      _id: { $in: eventRegistrationId },
    });

    if (registrations.length !== eventRegistrationId.length) {
      return res.status(400).json({
        message: "Some event registrations are invalid",
      });
    }

    //  CHECK duplicate assignment globally
    const alreadyAssigned = await AssignTravelService.find({
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
        message: "Some registrations already assigned to another sponsor",
        duplicateIds,
      });
    }

    // UPSERT
    const assign = await AssignTravelService.findOneAndUpdate(
      { eventId, sponsorId },
      {
        $addToSet: {
          eventRegistrationId: { $each: eventRegistrationId },
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Travel service assigned successfully",
      data: assign,
    });

  } catch (error) {
    console.error("Assign travel error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// =======================
// GET Assigned Travel Services
// =======================
export const getAssignedTravelServicesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await AssignTravelService.find({ eventId })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
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
// GET Logged In Sponsor Assigned Travel Services
// =======================
export const getMyAssignedTravelServices = async (req, res) => {
  try {
    const { eventId } = req.params;

    // logged in sponsor id
    const sponsorId = req.sponsor._id;

    const data = await AssignTravelService.findOne({
      eventId,
      sponsorId,
    })
      .populate(
        "sponsorId",
        "sponsorName contactPersonName email mobile"
      )
      .populate(
        "eventRegistrationId",
        "prefix name email mobile regNum"
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No assigned travel services found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Get My Travel Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =======================
// REMOVE Assigned Registration
// =======================
export const removeAssignedTravelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationId } = req.body;

    const assign = await AssignTravelService.findById(id);
    if (!assign) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // =======================
    // CHECK IF TRAVEL ALREADY BOOKED
    // =======================
    const bookedTravel = await Travel.findOne({
      eventId: assign.eventId,
      eventRegistrationId: registrationId,
      sponsorId: assign.sponsorId,
      createdBy: "sponsor",
    });

    if (bookedTravel) {
      return res.status(400).json({
        success: false,
        message:
          "This registration already booked travel. You cannot remove assigned travel service.",
      });
    }

    assign.eventRegistrationId = assign.eventRegistrationId.filter(
      (item) => item.toString() !== registrationId
    );

    await assign.save();

    // delete empty doc
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
// REASSIGN Registration to another Sponsor
// =======================
export const reassignTravelService = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { registrationId, newSponsorId } = req.body;

    if (!registrationId || !newSponsorId) {
      return res.status(400).json({
        message: "registrationId and newSponsorId are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const sponsor = await Sponsor.findById(newSponsorId);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    // =======================
    // CHECK IF TRAVEL ALREADY BOOKED
    // =======================
    const bookedTravel = await Travel.findOne({
      eventId,
      eventRegistrationId: registrationId,
      createdBy: "sponsor",
    });

    if (bookedTravel) {
      return res.status(400).json({
        success: false,
        message:
          "This registration already booked travel. You cannot reassign travel service.",
      });
    }

    // check already assigned
    const existing = await AssignTravelService.findOne({
      eventId,
      sponsorId: newSponsorId,
      eventRegistrationId: registrationId,
    });

    if (existing) {
      return res.status(400).json({
        message: "Already assigned to this sponsor",
      });
    }

    // remove from current
    await AssignTravelService.updateOne(
      { eventId, eventRegistrationId: registrationId },
      { $pull: { eventRegistrationId: registrationId } }
    );

    // add to new sponsor
    const updated = await AssignTravelService.findOneAndUpdate(
      { eventId, sponsorId: newSponsorId },
      {
        $addToSet: { eventRegistrationId: registrationId },
      },
      { new: true, upsert: true }
    );

    // remove empty docs
    await AssignTravelService.deleteMany({
      eventId,
      eventRegistrationId: { $size: 0 },
    });

    return res.status(200).json({
      success: true,
      message: "Reassigned successfully",
      data: updated,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};