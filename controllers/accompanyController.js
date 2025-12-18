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
      isPaid: true,
      isSuspended: false, //  Only non-suspended registration
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
      isSuspended: false, //  Only non-suspended registration
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

    // Add accompanies (force isSuspended=false for each)
    accompanies.forEach((a) => {
      accompanyDoc.accompanies.push({
        ...a,
        isSuspended: false, // ensure consistent default
      });
    });
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


/* 
========================================================
  3️ Get All Paid Accompanies for Logged-in User (Specific Event)
========================================================
  @route   GET /api/accompanies/paid/:eventId
  @access  Protected (user)
========================================================
*/
export const getAllPaidAccompaniesByEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find accompany records for this event and user
    const accompanies = await Accompany.find({ userId, eventId })
      .populate({
        path: "eventId",
        select: "eventName eventCode startDate endDate",
      })
      .populate({
        path: "eventRegistrationId",
        select: "regNum registrationSlabName isPaid",
      })
      .sort({ createdAt: -1 });

    // Filter out only paid accompanies (inside the array)
    const paidAccompanies = accompanies
      .map((doc) => {
        const paidList = doc.accompanies.filter((a) => a.isPaid === true && a.isSuspended === false);
        if (paidList.length > 0) {
          return {
            _id: doc._id,
            event: doc.eventId,
            registration: doc.eventRegistrationId,
            paidAccompanies: paidList,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (paidAccompanies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No paid accompanies found for this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paid accompanies fetched successfully",
      data: paidAccompanies,
    });
  } catch (error) {
    console.error("Get all paid accompanies by event error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



/* 
========================================================
  4️ Edit Paid Accompanies (Only editable fields)
========================================================
  @route   PUT /api/accompanies/:accompanyId/edit
  @access  Protected (user)
========================================================
*/
export const editPaidAccompanies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accompanyId } = req.params;
    const { accompanies } = req.body; // array of objects with _id + editable fields

    if (!Array.isArray(accompanies) || accompanies.length === 0) {
      return res.status(400).json({ message: "No accompany data provided for edit" });
    }

    // Fetch accompany document
    const accompanyDoc = await Accompany.findOne({
      _id: accompanyId,
      userId,
    });

    if (!accompanyDoc) {
      return res.status(404).json({ message: "Accompany record not found" });
    }

    // Update only the allowed fields for paid accompany entries
    let updatedCount = 0;

    accompanies.forEach((item) => {
      const sub = accompanyDoc.accompanies.id(item._id);
      if (sub && sub.isPaid) {
        // Only update allowed fields
        if (item.fullName !== undefined) sub.fullName = item.fullName.trim();
        if (item.relation !== undefined) sub.relation = item.relation.trim();
        if (item.gender !== undefined) sub.gender = item.gender.trim();
        if (item.age !== undefined) sub.age = Number(item.age);
        if (item.mealPreference !== undefined) sub.mealPreference = item.mealPreference.trim();
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      return res.status(400).json({
        message: "No valid paid accompanies found to edit or invalid IDs provided",
      });
    }

    await accompanyDoc.save();

    res.status(200).json({
      success: true,
      message: `${updatedCount} paid accompany record(s) updated successfully`,
      data: accompanyDoc,
    });
  } catch (error) {
    console.error("Edit paid accompanies error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  5️ Get All Paid Accompanies for an Event (Event Admin)
========================================================
  @route   GET /api/accompanies/event-admin/events/:eventId/paid
  @access  Protected (eventAdmin)
========================================================
*/
export const getAllPaidAccompaniesByEvent_Admin = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find accompany records for this event
    const accompanyDocs = await Accompany.find({ eventId })
      .populate({
        path: "userId",
        select: "name email mobile", // You can adjust fields
      })
      .populate({
        path: "eventRegistrationId",
        select: "regNum isPaid registrationSlabId",
        populate: {
          path: "registrationSlabId",
          select: "slabName amount",
        },
      })
      .sort({ createdAt: -1 });

    // Filter out only paid accompanies (inside the array)
    const allPaidAccompanies = accompanyDocs
      .map((doc) => {
        const paidList = doc.accompanies.filter((a) => a.isPaid === true);
        if (paidList.length > 0) {
          return {
            _id: doc._id,
            user: doc.userId,
            registration: doc.eventRegistrationId,
            paidAccompanies: paidList,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (allPaidAccompanies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No paid accompanies found for this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "All paid accompanies fetched successfully",
      event: { id: event._id, name: event.eventName },
      totalAccompanies: allPaidAccompanies.length,
      data: allPaidAccompanies,
    });
  } catch (error) {
    console.error("Get all paid accompanies by event (admin) error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  6️ Update Suspension Status of a Single Accompany (Event Admin)
========================================================
  @route   PATCH /api/accompanies/event-admin/:accompanyId/suspend/:subId
  @access  Protected (eventAdmin)
========================================================
*/
export const updateAccompanySuspension = async (req, res) => {
  try {
    const { accompanyId, subId } = req.params;
    const { isSuspended } = req.body;

    // Validate input
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for isSuspended. Must be true or false.",
      });
    }

    // Find the main accompany document
    const accompanyDoc = await Accompany.findById(accompanyId);
    if (!accompanyDoc) {
      return res.status(404).json({
        success: false,
        message: "Accompany record not found",
      });
    }

    // Find the specific accompany subdocument by its _id
    const subAccompany = accompanyDoc.accompanies.id(subId);
    if (!subAccompany) {
      return res.status(404).json({
        success: false,
        message: "Accompany member not found",
      });
    }

    // Update suspension status
    subAccompany.isSuspended = isSuspended;
    await accompanyDoc.save();

    res.status(200).json({
      success: true,
      message: `Accompany member ${isSuspended ? "suspended" : "unsuspended"
        } successfully`,
      data: subAccompany,
    });
  } catch (error) {
    console.error("Update accompany suspension error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==============================================================
// 7 Check If Email Exists in Event Registration Model (Event Admin)
// ==============================================================
export const checkEmailExists = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required in the URL",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists for this event
    const existing = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
      isPaid: true,
      isSuspended: false, //  Only non-suspended registration
    }).select("_id eventId userId registrationSlabId")
      .populate({
        path: "registrationSlabId",
        select: "AccompanyAmount",
      });

    if (existing) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Email already registered for this event",
        existing,
      });
    }
    return res.status(200).json({
      success: true,
      exists: false,
      message: "Email not registered for this event",
      existing: null,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking email",
    });
  }
};
 

/*
========================================================
  8 Add Accompanies (After Registration)  (Event Admin)
========================================================
  @route   POST /api/accompanies/:eventId/add
  @access  Protected (Event Admin)
========================================================
*/
export const addAccompaniesByEventAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, eventRegistrationId, accompanies } = req.body;

    if (!Array.isArray(accompanies) || accompanies.length === 0) {
      return res.status(400).json({ message: "No accompanies provided" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Validate registration
    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
      userId,
      isPaid: true,
      isSuspended: false,
    }).populate("registrationSlabId", "AccompanyAmount");

    if (!registration) {
      return res.status(400).json({
        message: "Valid paid event registration not found",
      });
    }

    const accompanyAmount = registration.registrationSlabId?.AccompanyAmount || 0;

    // Find / create accompany doc
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

    // ==============================
    // Generate next accompany counter
    // ==============================
    let existingCount = 0;

    const allAccompanyDocs = await Accompany.find({
      eventRegistrationId,
    });

    allAccompanyDocs.forEach((doc) => {
      doc.accompanies.forEach((a) => {
        if (a.regNumGenerated) existingCount++;
      });
    });

    let counter = existingCount + 1;

    // ==============================
    // Add accompanies as PAID
    // ==============================
    accompanies.forEach((a) => {
      accompanyDoc.accompanies.push({
        fullName: a.fullName,
        relation: a.relation,
        gender: a.gender,
        age: a.age,
        mealPreference: a.mealPreference,
        amount: a.amount,
        spotRegistration: true,
        isPaid: true,
        regNumGenerated: true,
        regNum: `${registration.regNum}-A${counter}`,
        isSuspended: false,
      });
      counter++;
    });

    await accompanyDoc.save();

    res.status(201).json({
      success: true,
      message: "Accompanies added successfully by event admin (marked as paid)",
      data: accompanyDoc,
    });
  } catch (error) {
    console.error("Add accompanies by admin error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  9 Get All Paid Accompanies for (Specific Event)
========================================================
  @access  Protected (Event Admin)
========================================================
*/
export const getAllSpecificUserAccompanyesByEventAdmin = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find accompany records for this event and user
    const accompanies = await Accompany.find({ userId, eventId })
      .sort({ createdAt: -1 });

    // Filter out only paid accompanies (inside the array)
    const paidAccompanies = accompanies
      .map((doc) => {
        const paidList = doc.accompanies.filter((a) => a.isPaid === true && a.isSuspended === false);
        if (paidList.length > 0) {
          return {
            _id: doc._id,
            event: doc.eventId,
            registration: doc.eventRegistrationId,
            paidAccompanies: paidList,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (paidAccompanies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No paid accompanies found for this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paid accompanies fetched successfully",
      data: paidAccompanies,
    });
  } catch (error) {
    console.error("Get all paid accompanies by event error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

