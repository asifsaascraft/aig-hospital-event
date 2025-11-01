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

/*
========================================================
  2️ Add Accompanies (After Registration)
========================================================
  @route   POST /api/accompanies/:eventId/:eventRegistrationId/add
  @access  Protected (user)
========================================================
*/
export const addAccompanies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, eventRegistrationId } = req.params;
    const { accompanies } = req.body; // array of accompany objects

    if (!Array.isArray(accompanies) || accompanies.length === 0) {
      return res.status(400).json({ message: "No accompanies provided" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
      userId,
      isPaid: true, // user must have paid registration first
    });
    if (!registration)
      return res.status(400).json({ message: "You must complete event registration first" });

    // Find existing accompany entry for this registration (if any)
    let accompanyDoc = await Accompany.findOne({
      userId,
      eventId,
      eventRegistrationId,
    });

    if (!accompanyDoc) {
      accompanyDoc = new Accompany({
        userId,
        eventId,
        eventRegistrationId,
        accompanies: [],
      });
    }

    // Add accompanies
    accompanyDoc.accompanies.push(...accompanies);
    await accompanyDoc.save();

    res.status(201).json({
      success: true,
      message: "Accompanies added successfully (unpaid)",
      data: accompanyDoc,
    });
  } catch (error) {
    console.error("Add accompanies error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};