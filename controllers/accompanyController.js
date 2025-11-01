// controllers/accompanyController.js
import Accompany from "../models/Accompany.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import RegistrationSlab from "../models/RegistrationSlab.js";

/* 
========================================================
  1️ Get Accompany Amount for a User Registration
========================================================
  @route   GET /api/accompanies/:eventId/:eventRegistrationId/amount
  @access  Protected (user)
========================================================
*/
export const getAccompanyAmount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, eventRegistrationId } = req.params;

    //  Check if Event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Check if EventRegistration exists and belongs to the user
    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
      userId,
    });

    if (!registration) {
      return res
        .status(404)
        .json({ message: "Event registration not found for this user" });
    }

    //  Get the registration slab linked to that registration
    const slab = await RegistrationSlab.findById(registration.registrationSlabId);

    if (!slab) {
      return res
        .status(404)
        .json({ message: "Registration slab not found for this registration" });
    }

    //  Return the accompany amount
    res.status(200).json({
      success: true,
      message: "Accompany amount fetched successfully",
      data: {
        eventId,
        eventRegistrationId,
        accompanyAmount: slab.AccompanyAmount,
      },
    });
  } catch (error) {
    console.error("Get accompany amount error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



/* ========================================================
   2. Add Accompanies to a Registration
   Route: POST /api/events/:eventId/registrations/:eventRegistrationId/accompanies
   Access: Private (User)
======================================================== */
export const addAccompanies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, eventRegistrationId } = req.params;
    const { accompanies } = req.body; // expect array of accompanies

    if (!Array.isArray(accompanies) || accompanies.length === 0) {
      return res.status(400).json({ message: "At least one accompany is required" });
    }

    // Ensure event and registration exist
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    // Create accompany record
    const accompanyRecord = await Accompany.create({
      userId,
      eventId,
      eventRegistrationId,
      accompanies: accompanies.map((acc) => ({
        fullName: acc.fullName,
        relation: acc.relation,
        gender: acc.gender,
        age: acc.age,
        mealPreference: acc.mealPreference,
        isPaid: false,
      })),
    });

    res.status(201).json({
      success: true,
      message: "Accompany details added successfully (Unpaid)",
      data: accompanyRecord,
    });
  } catch (error) {
    console.error("Add accompanies error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   3. Get My Accompanies for a Registration
   Route: GET /api/events/:eventId/registrations/:eventRegistrationId/accompanies
   Access: Private (User)
======================================================== */
export const getMyAccompanies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, eventRegistrationId } = req.params;

    const accompanies = await Accompany.findOne({
      userId,
      eventId,
      eventRegistrationId,
    }).populate({
      path: "eventId",
      select: "eventName shortName startDate endDate",
    });

    if (!accompanies)
      return res.status(404).json({ message: "No accompany record found" });

    res.status(200).json({
      success: true,
      message: "Accompany details fetched successfully",
      data: accompanies,
    });
  } catch (error) {
    console.error("Get accompanies error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   4. Mark Accompanies as Paid (after payment success)
   Route: PATCH /api/accompanies/:accompanyId/mark-paid
   Access: Private (User)
======================================================== */
export const markAccompanyPaid = async (req, res) => {
  try {
    const { accompanyId } = req.params;

    const accompany = await Accompany.findById(accompanyId);
    if (!accompany) return res.status(404).json({ message: "Accompany record not found" });

    accompany.accompanies.forEach((acc) => (acc.isPaid = true));
    await accompany.save();

    res.status(200).json({
      success: true,
      message: "Accompany payment marked as paid",
      data: accompany,
    });
  } catch (error) {
    console.error("Mark accompany paid error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
