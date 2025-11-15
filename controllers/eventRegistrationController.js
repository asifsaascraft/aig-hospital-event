import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import User from "../models/User.js";


/* 
========================================================
  1. Get Prefilled Registration Form Data (User)
========================================================*/
export const getPrefilledRegistrationForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("venueName", "name"); // Corrected field

    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findById(userId).select(
      "name prefix gender email mobile designation affiliation medicalCouncilState medicalCouncilRegistration mealPreference country city state address pincode"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const slabs = await RegistrationSlab.find({ eventId }).sort({ createdAt: -1 });

    const prefilledData = {
      name: user.name || "",
      prefix: user.prefix || "",
      gender: user.gender || "",
      email: user.email || "",
      mobile: user.mobile || "",
      designation: user.designation || "",
      affiliation: user.affiliation || "",
      medicalCouncilState: user.medicalCouncilState || "",
      medicalCouncilRegistration: user.medicalCouncilRegistration || "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      address: user.address || "",
      pincode: user.pincode || "",
    };

    res.status(200).json({
      success: true,
      message: "Prefilled registration form data fetched successfully",
      data: { event, slabs, user: prefilledData },
    });
  } catch (error) {
    console.error("Get prefilled registration form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  2. Register for an Event (User)
========================================================*/
export const registerForEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const {
      registrationSlabId,
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      medicalCouncilState,
      medicalCouncilRegistration,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check for suspended registration first
    const suspendedReg = await EventRegistration.findOne({
      userId,
      eventId,
      isSuspended: true,
    });

    if (suspendedReg) {
      return res.status(403).json({
        success: false,
        message:
          "Your previous registration for this event is suspended. Please contact the Event Admin.",
      });
    }

    //  Only check for existing **paid** registration
    const existingPaidReg = await EventRegistration.findOne({
      userId,
      eventId,
      isPaid: true
    });

    if (existingPaidReg) {
      return res.status(400).json({ message: "You have already registered and paid for this event" });
    }

    const registration = await EventRegistration.create({
      userId,
      eventId,
      registrationSlabId,
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      medicalCouncilState,
      medicalCouncilRegistration,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
      isPaid: false,
      regNumGenerated: false,
      isSuspended: false,
    });

    res.status(201).json({
      success: true,
      message: "Event registration created successfully (Unpaid)",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  3. Get All Paid Registrations for Logged-in User
========================================================*/
export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const registrations = await EventRegistration.find({
      userId,
      isPaid: true,
      isSuspended: false,
    })
      .populate({
        path: "eventId",
        select: "eventName shortName startDate endDate dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount", // Include more fields if needed
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Paid registrations fetched successfully",
      data: registrations,
    });
  } catch (error) {
    console.error("Get paid registrations error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


/* 
========================================================
  4. Get Registration By ID
========================================================*/
export const getRegistrationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { registrationId } = req.params;

    const registration = await EventRegistration.findOne({
      _id: registrationId,
      userId,
      isPaid: true,
      isSuspended: false,
    })
      .populate({
        path: "eventId",
        select: "eventName shortName startDate endDate dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
      });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found or unpaid" });
    }

    res.status(200).json({
      success: true,
      message: "Registration fetched successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Get registration by ID error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  5. Get All Paid Registrations for an Event (Event Admin)
========================================================
*/
export const getAllRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch all paid registrations for this event
    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
    })
      .populate({

        path: "registrationSlabId",
        select: "slabName amount",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All paid registrations fetched successfully",
      event: { id: event._id, name: event.eventName },
      totalRegistrations: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get all registrations by event error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  6. Update Registration Suspension Status (Event Admin)
========================================================
*/
export const updateRegistrationSuspension = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { isSuspended } = req.body;

    // Validate input
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for isSuspended. Must be true or false.",
      });
    }

    // Find and update registration
    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Event registration not found",
      });
    }

    registration.isSuspended = isSuspended;
    await registration.save();

    res.status(200).json({
      success: true,
      message: `Registration ${isSuspended ? "suspended" : "unsuspended"} successfully`,
      data: registration,
    });
  } catch (error) {
    console.error("Update registration suspension error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
