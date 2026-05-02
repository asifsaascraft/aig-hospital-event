import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Accommodation Quota
// =======================
export const createSponsorAccomodationQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, QuotaId, numberOfQuota, startDateTime, endDateTime } = req.body;

    // ===============================
    // Required check
    // ===============================
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        message: "Start and End date time are required",
      });
    }

    if (numberOfQuota === undefined || numberOfQuota < 1) {
      return res.status(400).json({
        message: "Number of quota must be at least 1",
      });
    }

    // ===============================
    // Validate format
    // ===============================
    if (isNaN(new Date(startDateTime))) {
      return res.status(400).json({ message: "Invalid startDateTime format" });
    }

    if (isNaN(new Date(endDateTime))) {
      return res.status(400).json({ message: "Invalid endDateTime format" });
    }

    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    // ===============================
    // Validate Event
    // ===============================
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ===============================
    // Validate Sponsor
    // ===============================
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    // ===============================
    // Prevent duplicate sponsor quota (same event)
    // ===============================
    const existingQuota = await SponsorAccomodationQuota.findOne({
      sponsorId,
      eventId,
    });

    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has an accommodation quota.",
      });
    }

    // ===============================
    // Validate AddRoom (QuotaId)
    // ===============================
    const room = await AddRoom.findById(QuotaId);
    if (!room) {
      return res.status(404).json({ message: "Room quota not found" });
    }

    //  NEW: event validation
    if (room.eventId.toString() !== eventId) {
      return res.status(400).json({
        message: "Room does not belong to this event",
      });
    }

    //  Prevent global over-allocation
    const totalAllocated = await SponsorAccomodationQuota.aggregate([
      {
        $match: { QuotaId },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$numberOfQuota" },
        },
      },
    ]);

    const alreadyAllocated = totalAllocated[0]?.total || 0;

    if (alreadyAllocated + numberOfQuota > room.numberOfRooms) {
      return res.status(400).json({
        message: "Total quota exceeds available rooms",
      });
    }

    // ===============================
    // Check availability
    // ===============================
    if (room.availableRooms < numberOfQuota) {
      return res.status(400).json({
        message: `Only ${room.availableRooms} rooms available`,
      });
    }

    // ===============================
    // Deduct rooms
    // ===============================
    room.availableRooms -= numberOfQuota;
    await room.save();

    // ===============================
    // Create record
    // ===============================
    const newQuota = await SponsorAccomodationQuota.create({
      eventId,
      sponsorId,
      QuotaId,
      numberOfQuota,
      startDateTime: parsedStart,
      endDateTime: parsedEnd,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor accommodation quota created successfully",
      data: newQuota,
    });

  } catch (error) {
    console.error("Create Accommodation Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Get All by Event
// =======================
export const getSponsorAccomodationQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorAccomodationQuota.find({ eventId })
      .populate("sponsorId")
      .populate("QuotaId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: quotas,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Update
// =======================
export const updateSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, numberOfQuota, startDateTime, endDateTime } = req.body;

    const record = await SponsorAccomodationQuota.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Quota not found" });
    }

    // ===============================
    // Prevent duplicate sponsor quota on update
    // ===============================
    if (
      sponsorId &&
      sponsorId.toString() !== record.sponsorId.toString()
    ) {
      const existingQuota = await SponsorAccomodationQuota.findOne({
        sponsorId,
        eventId: record.eventId,
      });

      if (existingQuota) {
        return res.status(400).json({
          success: false,
          message: "This sponsor already has an accommodation quota.",
        });
      }

      record.sponsorId = sponsorId;
    }

    const room = await AddRoom.findById(record.QuotaId);

    if (!room) {
      return res.status(404).json({
        message: "Associated room not found",
      });
    }

    // ===============================
    // Handle quota change
    // ===============================
    if (numberOfQuota !== undefined) {
      //  NEW: total allocation check
      const totalAllocated = await SponsorAccomodationQuota.aggregate([
        {
          $match: {
            QuotaId: record.QuotaId,
            _id: { $ne: record._id },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$numberOfQuota" },
          },
        },
      ]);

      const alreadyAllocated = totalAllocated[0]?.total || 0;

      if (alreadyAllocated + numberOfQuota > room.numberOfRooms) {
        return res.status(400).json({
          message: "Total quota exceeds available rooms",
        });
      }

      //  EXISTING LOGIC (keep this)
      const diff = numberOfQuota - record.numberOfQuota;

      if (diff > 0 && room.availableRooms < diff) {
        return res.status(400).json({
          message: `Only ${room.availableRooms} additional rooms available`,
        });
      }

      room.availableRooms -= diff;
      record.numberOfQuota = numberOfQuota;

      await room.save();
    }
    // ===============================
    // Date validation (same logic)
    // ===============================
    if (startDateTime && isNaN(new Date(startDateTime))) {
      return res.status(400).json({ message: "Invalid startDateTime format" });
    }

    if (endDateTime && isNaN(new Date(endDateTime))) {
      return res.status(400).json({ message: "Invalid endDateTime format" });
    }

    const finalStart = startDateTime
      ? new Date(startDateTime)
      : record.startDateTime;

    const finalEnd = endDateTime
      ? new Date(endDateTime)
      : record.endDateTime;

    if (finalEnd < finalStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    record.startDateTime = finalStart;
    record.endDateTime = finalEnd;

    await record.save();

    res.status(200).json({
      success: true,
      data: record,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Delete
// =======================
export const deleteSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SponsorAccomodationQuota.findById(id);
    if (!record) {
      return res.status(404).json({ message: "Quota not found" });
    }

    const room = await AddRoom.findById(record.QuotaId);

    if (!room) {
      return res.status(404).json({
        message: "Associated room not found",
      });
    }

    room.availableRooms += record.numberOfQuota;

    //  Clamp (Fix 2 also here)
    if (room.availableRooms > room.numberOfRooms) {
      room.availableRooms = room.numberOfRooms;
    }

    await room.save();

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quota deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};