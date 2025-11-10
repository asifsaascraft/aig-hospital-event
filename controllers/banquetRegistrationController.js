import BanquetRegistration from "../models/BanquetRegistration.js";
import Accompany from "../models/Accompany.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";

/* 
========================================================
  1️ Register Banquet for User or Accompany
========================================================
  @route   POST /api/banquet-registrations/:eventId/:eventRegistrationId/register
  @access  Protected (user)
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
    });

    if (!registration)
      return res
        .status(400)
        .json({ message: "You must complete event registration first" });

    // Build banquets array with auto parent accompany mapping
    const banquetEntries = [];

    for (const b of banquets) {
      const entry = { ...b };

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
  @route   GET /api/banquet-registrations/paid/:eventId
  @access  Protected (user)
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
        select: "banquetName date time venue",
      })
      .populate({
        path: "banquets.userId",
        select: "fullName email",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter only paid banquets
    const paidBanquets = [];

    for (const reg of banquetRegs) {
      const paidEntries = [];

      for (const b of reg.banquets) {
        if (b.isPaid) {
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
