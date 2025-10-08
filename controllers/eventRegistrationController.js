import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import User from "../models/User.js";

/* 
========================================================
  1️ Get Prefilled Registration Form Data (User)
  Route: GET /api/events/:eventId/prefilled
  Access: Private (User)
========================================================
*/
export const getPrefilledRegistrationForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch user details
    const user = await User.findById(userId).select(
      "name prefix gender email mobile designation affiliation medicalCouncilState medicalCouncilRegistration mealPreference country city state pincode"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch registration slabs for this event
    const slabs = await RegistrationSlab.find({ eventId }).sort({ createdAt: -1 });

    // Prepare prefilled data
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
      mealPreference: user.mealPreference || "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      pincode: user.pincode || "",
    };

    res.status(200).json({
      success: true,
      message: "Prefilled registration form data fetched successfully",
      data: {
        event,
        slabs,
        user: prefilledData,
      },
    });
  } catch (error) {
    console.error("Get prefilled registration form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  2️ Register for an Event (User)
  Route: POST /api/events/:eventId/register
  Access: Private (User)
========================================================
*/
export const registerForEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const {
      registrationSlabName,
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
    } = req.body;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new registration
    const registration = await EventRegistration.create({
      userId,
      eventId,
      registrationSlabName,
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
    });

    res.status(201).json({
      success: true,
      message: "Event registration successful",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);

    // Handle duplicate registration via MongoDB unique index
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "User already registered for this event" });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  3️ Get All Registrations for Logged-in User
  Route: GET /api/my/registrations
  Access: Private (User)
========================================================
*/
export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const registrations = await EventRegistration.find({ userId })
      .populate("eventId", "title startDate endDate venue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User event registrations fetched successfully",
      data: registrations,
    });
  } catch (error) {
    console.error("Get user registrations error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
