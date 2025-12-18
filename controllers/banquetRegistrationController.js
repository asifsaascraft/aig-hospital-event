import BanquetRegistration from "../models/BanquetRegistration.js";
import Accompany from "../models/Accompany.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";

/* 
========================================================
  1️ Register Banquet for User or Accompany or Other
========================================================
*/
export const registerBanquet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, eventRegistrationId } = req.params;
    const { banquetId, banquets } = req.body;

    if (!banquetId)
      return res.status(400).json({ message: "Banquet ID is required" });

    if (!Array.isArray(banquets) || banquets.length === 0)
      return res.status(400).json({ message: "Banquets data is required" });

    // Validate Event
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Validate Event Registration
    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
      userId,
      isPaid: true, // Only allow if user registration is paid
      isSuspended: false, //  Only non-suspended registration
    });

    if (!registration)
      return res
        .status(400)
        .json({ message: "You must complete event registration first" });

    // Build banquets array with auto parent accompany mapping
    const banquetEntries = [];

    for (const b of banquets) {
      const entry = {
        ...b,
        isSuspended: false,
      };

      // If accompanySubId is provided → find parent accompany doc
      if (b.accompanySubId) {
        const parentAccompany = await Accompany.findOne({
          "accompanies._id": b.accompanySubId,
        }).select("_id");

        if (!parentAccompany) {
          return res.status(404).json({
            message: `Parent accompany not found for subId ${b.accompanySubId}`,
          });
        }

        entry.accompanyParentId = parentAccompany._id;
      }

      banquetEntries.push(entry);
    }

    // Save banquet registration
    const banquetRegistration = await BanquetRegistration.create({
      banquetId,
      userId,
      eventId,
      eventRegistrationId,
      banquets: banquetEntries,
    });

    res.status(201).json({
      success: true,
      message: "Banquet registered successfully (unpaid)",
      data: banquetRegistration,
    });
  } catch (error) {
    console.error("Register banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  2️ Get All Paid Banquets for Logged-in User (Specific Event)
========================================================
*/
export const getAllPaidBanquetsByEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Find banquet registrations for this user + event
    const banquetRegs = await BanquetRegistration.find({ userId, eventId })
      .populate({
        path: "eventId",
        select: "eventName eventCode startDate endDate",
      })
      .populate({
        path: "eventRegistrationId",
        select: "regNum registrationSlabName isPaid",
      })
      .populate({
        path: "banquetId",
        select: "banquetslabName amount startDate endDate",
      })
      .populate({
        path: "banquets.userId",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter only paid banquets
    const paidBanquets = [];

    for (const reg of banquetRegs) {
      const paidEntries = [];

      for (const b of reg.banquets) {
        if (b.isPaid && b.isSuspended === false) {
          const banquetData = { ...b };

          // If accompanySubId exists, fetch accompany details
          if (b.accompanySubId) {
            const parent = await Accompany.findOne({
              "accompanies._id": b.accompanySubId,
            }).lean();

            if (parent) {
              const sub = parent.accompanies.find(
                (a) => a._id.toString() === b.accompanySubId.toString()
              );
              if (sub) {
                banquetData.accompanyDetails = {
                  parentAccompanyId: parent._id,
                  ...sub,
                };
              }
            }
          }

          paidEntries.push(banquetData);
        }
      }

      if (paidEntries.length > 0) {
        paidBanquets.push({
          _id: reg._id,
          banquet: reg.banquetId,
          event: reg.eventId,
          registration: reg.eventRegistrationId,
          paidBanquets: paidEntries,
        });
      }
    }

    if (paidBanquets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No paid banquet registrations found for this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paid banquets fetched successfully",
      data: paidBanquets,
    });
  } catch (error) {
    console.error("Get paid banquets error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  3️ Edit Paid Banquets (Only update otherName)
========================================================
*/
export const editPaidBanquets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { banquetRegistrationId } = req.params;
    const { banquets } = req.body; // array of objects with _id + otherName

    if (!Array.isArray(banquets) || banquets.length === 0) {
      return res.status(400).json({ message: "No banquet data provided for edit" });
    }

    // Fetch banquet registration document
    const banquetDoc = await BanquetRegistration.findOne({
      _id: banquetRegistrationId,
      userId,
    });

    if (!banquetDoc) {
      return res.status(404).json({ message: "Banquet registration not found" });
    }

    let updatedCount = 0;

    banquets.forEach((item) => {
      const sub = banquetDoc.banquets.id(item._id);
      if (sub && sub.isPaid) {
        if (item.otherName !== undefined) sub.otherName = item.otherName.trim();
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      return res.status(400).json({
        message: "No valid paid banquet records found to edit or invalid IDs provided",
      });
    }

    await banquetDoc.save();

    res.status(200).json({
      success: true,
      message: `${updatedCount} paid banquet record(s) updated successfully`,
      data: banquetDoc,
    });
  } catch (error) {
    console.error("Edit paid banquets error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


/* 
========================================================
  4️ Get All Paid Banquets for an Event (Event Admin)
========================================================
*/
export const getAllPaidBanquetsByEvent_Admin = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch banquet registrations for this event
    const banquetRegs = await BanquetRegistration.find({ eventId })
      .populate({
        path: "userId",
        select: "name email mobile", // Adjust field names as per your User model
      })
      .populate({
        path: "eventRegistrationId",
        select: "regNum isPaid registrationSlabId",
        populate: {
          path: "registrationSlabId",
          select: "slabName amount",
        },
      })
      .populate({
        path: "banquetId",
        select: "banquetslabName amount startDate endDate",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out only paid banquets inside the nested array
    const allPaidBanquets = [];

    for (const reg of banquetRegs) {
      const paidEntries = [];

      for (const b of reg.banquets) {
        if (b.isPaid) {
          const banquetData = { ...b };

          // If accompanySubId exists → fetch accompany details
          if (b.accompanySubId) {
            const parent = await Accompany.findOne({
              "accompanies._id": b.accompanySubId,
            }).lean();

            if (parent) {
              const sub = parent.accompanies.find(
                (a) => a._id.toString() === b.accompanySubId.toString()
              );
              if (sub) {
                banquetData.accompanyDetails = {
                  parentAccompanyId: parent._id,
                  ...sub,
                };
              }
            }
          }

          paidEntries.push(banquetData);
        }
      }

      if (paidEntries.length > 0) {
        allPaidBanquets.push({
          _id: reg._id,
          user: reg.userId,
          registration: reg.eventRegistrationId,
          banquet: reg.banquetId,
          paidBanquets: paidEntries,
        });
      }
    }

    if (allPaidBanquets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No paid banquet registrations found for this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "All paid banquets fetched successfully (Admin)",
      event: { id: event._id, name: event.eventName },
      totalBanquetRegistrations: allPaidBanquets.length,
      data: allPaidBanquets,
    });
  } catch (error) {
    console.error("Get all paid banquets by event (admin) error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  5️ Update Suspension Status of a Single Banquet Entry (Event Admin)
========================================================
*/
export const updateBanquetSuspension = async (req, res) => {
  try {
    const { banquetRegistrationId, banquetSubId } = req.params;
    const { isSuspended } = req.body;

    // Validate input
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for isSuspended. Must be true or false.",
      });
    }

    // Find the main banquet registration document
    const banquetDoc = await BanquetRegistration.findById(banquetRegistrationId);
    if (!banquetDoc) {
      return res.status(404).json({
        success: false,
        message: "Banquet registration record not found",
      });
    }

    // 1. Try normal banquet id match
    let subBanquet =
      banquetDoc.banquets.id(banquetSubId) ||
      banquetDoc.banquets.find((b) => b._id.toString() === banquetSubId);

    // 2. If accompany entry, match by accompanySubId
    if (!subBanquet) {
      subBanquet = banquetDoc.banquets.find(
        (b) => b.accompanySubId?.toString() === banquetSubId
      );
    }

    if (!subBanquet) {
      return res.status(404).json({
        success: false,
        message: "Banquet sub-entry not found",
      });
    }

    // Update suspension status
    subBanquet.isSuspended = isSuspended;
    await banquetDoc.save();

    res.status(200).json({
      success: true,
      message: `Banquet entry ${isSuspended ? "suspended" : "unsuspended"} successfully`,
      data: subBanquet,
    });
  } catch (error) {
    console.error("Update banquet suspension error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


/* 
========================================================
  6 Register Banquet for User or Accompany or Other (Event Admin)
========================================================
*/
export const registerBanquetByEventAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, eventRegistrationId, banquetId, banquets } = req.body;

    if (!banquetId)
      return res.status(400).json({ message: "Banquet ID is required" });

    if (!Array.isArray(banquets) || banquets.length === 0)
      return res.status(400).json({ message: "Banquets data is required" });

    // Validate Event
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Validate Event Registration
    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      eventId,
      userId,
      isPaid: true, // Only allow if user registration is paid
      isSuspended: false, //  Only non-suspended registration
    });

    if (!registration)
      return res
        .status(400)
        .json({ message: "You must complete event registration first" });

    // Build banquets array with auto parent accompany mapping
    const banquetEntries = [];

    for (const b of banquets) {

      if (typeof b.amount !== "number") {
        return res.status(400).json({
          message: "Amount is required for each banquet entry"
        });

      }
      const entry = {
        ...b,
        amount: b.amount,
        isPaid: true,
        spotRegistration: true,
        isSuspended: false,
      };

      // If accompanySubId is provided → find parent accompany doc
      if (b.accompanySubId) {
        const parentAccompany = await Accompany.findOne({
          "accompanies._id": b.accompanySubId,
        }).select("_id");

        if (!parentAccompany) {
          return res.status(404).json({
            message: `Parent accompany not found for subId ${b.accompanySubId}`,
          });
        }

        entry.accompanyParentId = parentAccompany._id;
      }

      banquetEntries.push(entry);
    }

    // Save banquet registration
    const banquetRegistration = await BanquetRegistration.create({
      banquetId,
      userId,
      eventId,
      eventRegistrationId,
      banquets: banquetEntries,
    });

    res.status(201).json({
      success: true,
      message: "Banquet registered successfully by event admin",
      data: banquetRegistration,
    });
  } catch (error) {
    console.error("Register banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};