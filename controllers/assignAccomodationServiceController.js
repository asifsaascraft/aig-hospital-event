import AssignAccomodationService from "../models/AssignAccomodationService.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";
import EventRegistration from "../models/EventRegistration.js";
import Accomodation from "../models/Accomodation.js";

// =======================
// ASSIGN Accommodation Service
// =======================
export const assignAccomodationService = async (req, res) => {
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
    const alreadyAssigned = await AssignAccomodationService.find({
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
    const assign = await AssignAccomodationService.findOneAndUpdate(
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
      message: "Accommodation service assigned successfully",
      data: assign,
    });

  } catch (error) {
    console.error("Assign accommodation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// =======================
// GET Assigned Accommodation Services
// =======================
export const getAssignedAccomodationServicesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await AssignAccomodationService.find({ eventId })
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
// GET Logged In Sponsor Assigned Accommodation Services
// =======================
export const getMyAssignedAccomodationServices = async (req, res) => {
  try {
    const { eventId } = req.params;

    // logged in sponsor id
    const sponsorId = req.sponsor._id;

    const data = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
    })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .populate(
        "eventRegistrationId",
        "prefix name email mobile regNum"
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No assigned accommodation services found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


// =======================
// REMOVE Assigned Registration
// =======================
export const removeAssignedAccomodationRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationId } = req.body;

    const assign = await AssignAccomodationService.findById(id);
    if (!assign) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // =======================
    // CHECK IF ACCOMMODATION ALREADY BOOKED
    // =======================
    const bookedAccomodation = await Accomodation.findOne({
      eventId: assign.eventId,
      sponsorId: assign.sponsorId,

      $or: [
        { eventRegistrationId: registrationId },
        { otherEventRegistrationId: registrationId },
      ],
    });

    if (bookedAccomodation) {
      return res.status(400).json({
        success: false,
        message:
          "This registration already booked accommodation. You cannot remove assigned accommodation service.",
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
export const reassignAccomodationService = async (req, res) => {
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
    // CHECK IF ACCOMMODATION ALREADY BOOKED
    // =======================
    const bookedAccomodation = await Accomodation.findOne({
      eventId,

      $or: [
        { eventRegistrationId: registrationId },
        { otherEventRegistrationId: registrationId },
      ],
    });

    if (bookedAccomodation) {
      return res.status(400).json({
        success: false,
        message:
          "This registration already booked accommodation. You cannot reassign accommodation service.",
      });
    }

    // check already assigned
    const existing = await AssignAccomodationService.findOne({
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
    await AssignAccomodationService.updateOne(
      { eventId, eventRegistrationId: registrationId },
      { $pull: { eventRegistrationId: registrationId } }
    );

    // add to new sponsor
    const updated = await AssignAccomodationService.findOneAndUpdate(
      { eventId, sponsorId: newSponsorId },
      {
        $addToSet: { eventRegistrationId: registrationId },
      },
      { new: true, upsert: true }
    );

    // remove empty docs
    await AssignAccomodationService.deleteMany({
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