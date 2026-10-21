import mongoose from "mongoose";
import AssignAccomodationService from "../models/AssignAccomodationService.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";
import EventRegistration from "../models/EventRegistration.js";
import Accomodation from "../models/Accomodation.js";

const findBookedAccommodation = (eventId, registrationIds) => {
  const ids = (
    Array.isArray(registrationIds) ? registrationIds : [registrationIds]
  ).map((id) => id.toString());

  return Accomodation.findOne({
    eventId,
    $or: [
      { eventRegistrationId: { $in: ids } },
      { otherEventRegistrationId: { $in: ids } },
    ],
  });
};

// =======================
// ASSIGN Accommodation Service
// =======================
export const assignAccomodationService = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, eventRegistrationId, remark } = req.body;

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
    const sponsor = await Sponsor.findOne({
      _id: sponsorId,
      eventId,
    });
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    // check registrations
    const registrations = await EventRegistration.find({
      _id: { $in: eventRegistrationId },
      eventId,
    });

    if (registrations.length !== eventRegistrationId.length) {
      return res.status(400).json({
        message: "Some event registrations are invalid",
      });
    }

    const bookedAccommodation = await findBookedAccommodation(
      eventId,
      eventRegistrationId,
    );

    if (bookedAccommodation) {
      return res.status(400).json({
        success: false,
        message:
          "One or more delegates already have accommodation booked. Their accommodation service cannot be assigned again.",
      });
    }

    //  CHECK duplicate assignment globally
    const alreadyAssigned = await AssignAccomodationService.find({
      eventId,
      eventRegistrationId: { $in: eventRegistrationId },
    });

    if (alreadyAssigned.length > 0) {
      const assignedIds = alreadyAssigned.flatMap((doc) =>
        doc.eventRegistrationId.map((id) => id.toString()),
      );

      const duplicateIds = eventRegistrationId.filter((id) =>
        assignedIds.includes(id),
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
        $set: {
          remark,
        },
      },
      { new: true, upsert: true },
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
      .populate("eventRegistrationId", "prefix name email mobile regNum");


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
// GET Logged In Sponsor Unbooked Assigned Accommodation Services
// =======================
export const getMyUnbookedAssignedAccomodationServices = async (
  req,
  res,
) => {
  try {
    const { eventId } = req.params;
    const sponsorId = req.sponsor._id;

    // Get this sponsor's accommodation assignment
    const assignedData = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
    })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .populate("eventRegistrationId", "prefix name email mobile regNum");

    if (!assignedData) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    // Get all assigned registration IDs
    const assignedRegistrationIds = assignedData.eventRegistrationId.map(
      (registration) => registration._id,
    );

    // Find bookings for either the primary delegate or the
    // second delegate selected for Twin Sharing
    const bookedAccommodations = await Accomodation.find({
      eventId,
      $or: [
        {
          eventRegistrationId: { $in: assignedRegistrationIds },
        },
        {
          otherEventRegistrationId: { $in: assignedRegistrationIds },
        },
      ],
    }).select("eventRegistrationId otherEventRegistrationId");

    // Collect every registration ID that is already booked
    const bookedRegistrationIds = new Set();

    for (const booking of bookedAccommodations) {
      if (booking.eventRegistrationId) {
        bookedRegistrationIds.add(
          booking.eventRegistrationId.toString(),
        );
      }

      if (booking.otherEventRegistrationId) {
        bookedRegistrationIds.add(
          booking.otherEventRegistrationId.toString(),
        );
      }
    }

    // Keep only assigned delegates who have no accommodation booking
    const unbookedRegistrations =
      assignedData.eventRegistrationId.filter(
        (registration) =>
          !bookedRegistrationIds.has(registration._id.toString()),
      );

    // Keep the same response structure as the existing API
    const data = {
      ...assignedData.toObject(),
      eventRegistrationId: unbookedRegistrations,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get My Unbooked Assigned Accommodation Services Error:",
      error,
    );

    return res.status(500).json({
      success: false,
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

    if (!registrationId || !mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        success: false,
        message: "A valid registrationId is required",
      });
    }

    const isAssigned = assign.eventRegistrationId.some(
      (item) => item.toString() === registrationId.toString(),
    );

    if (!isAssigned) {
      return res.status(404).json({
        success: false,
        message: "This registration is not part of this assignment",
      });
    }

    const bookedAccommodation = await findBookedAccommodation(
      assign.eventId,
      registrationId,
    );

    if (bookedAccommodation) {
      return res.status(400).json({
        success: false,
        message:
          "This delegate already has accommodation booked. You cannot remove the accommodation service assignment.",
      });
    }
    assign.eventRegistrationId = assign.eventRegistrationId.filter(
      (item) => item.toString() !== registrationId,
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

    if (
      !mongoose.isValidObjectId(eventId) ||
      !mongoose.isValidObjectId(registrationId) ||
      !mongoose.isValidObjectId(newSponsorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid eventId, registrationId and newSponsorId are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const sponsor = await Sponsor.findOne({
      _id: newSponsorId,
      eventId,
    });

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found for this event",
      });
    }

    // Prevent reassignment if accommodation is already booked.
    const bookedAccommodation = await findBookedAccommodation(
      eventId,
      registrationId,
    );

    if (bookedAccommodation) {
      return res.status(400).json({
        success: false,
        message:
          "This registration already has accommodation booked. You cannot reassign it.",
      });
    }

    // Find the assignment that currently contains this registration.
    const currentAssignment = await AssignAccomodationService.findOne({
      eventId,
      eventRegistrationId: registrationId,
    });

    if (!currentAssignment) {
      return res.status(404).json({
        success: false,
        message: "This registration is not currently assigned",
      });
    }

    if (currentAssignment.sponsorId.toString() === newSponsorId) {
      return res.status(400).json({
        success: false,
        message: "This registration is already assigned to this sponsor",
      });
    }

    // Remove only from the current assignment.
    currentAssignment.eventRegistrationId =
      currentAssignment.eventRegistrationId.filter(
        (id) => id.toString() !== registrationId,
      );

    if (currentAssignment.eventRegistrationId.length === 0) {
      await currentAssignment.deleteOne();
    } else {
      await currentAssignment.save();
    }

    // Assign to the new sponsor.
    const updated = await AssignAccomodationService.findOneAndUpdate(
      { eventId, sponsorId: newSponsorId },
      {
        $addToSet: {
          eventRegistrationId: registrationId,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Reassigned successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Reassign accommodation service error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =======================
// SPONSOR REMOVE ASSIGNED REGISTRATION
// =======================
export const sponsorRemoveAssignedAccomodationRegistration = async (
  req,
  res,
) => {
  try {
    const { eventId, registrationId } = req.params;

    // Logged-in sponsor
    const sponsorId = req.sponsor._id;

    if (!mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        success: false,
        message: "registrationId is required",
      });
    }

    // =======================
    // CHECK ASSIGNMENT
    // =======================
    const assign = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
      eventRegistrationId: registrationId,
    });

    if (!assign) {
      return res.status(404).json({
        success: false,
        message: "This registration is not assigned to you",
      });
    }

    // =======================
    // CHECK IF ACCOMMODATION ALREADY BOOKED
    // =======================
    const bookedAccommodation = await findBookedAccommodation(
      eventId,
      registrationId,
    );

    if (bookedAccommodation) {
      return res.status(400).json({
        success: false,
        message:
          "This delegate already has accommodation booked. You cannot remove the accommodation service assignment.",
      });
    }

    // =======================
    // REMOVE REGISTRATION
    // =======================
    assign.eventRegistrationId = assign.eventRegistrationId.filter(
      (item) => item.toString() !== registrationId,
    );

    await assign.save();

    // =======================
    // DELETE EMPTY ASSIGNMENT
    // =======================
    if (assign.eventRegistrationId.length === 0) {
      await assign.deleteOne();
    }

    return res.status(200).json({
      success: true,
      message: "Registration removed from accommodation service successfully",
    });
  } catch (error) {
    console.error("Sponsor remove accommodation assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
