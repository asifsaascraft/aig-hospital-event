import Accomodation from "../models/Accomodation.js";
import AddRoom from "../models/AddRoom.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";

// =======================
// Helper Functions
// =======================

const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return { h, m };
};

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDatesBetween = (start, end) => {
  const dates = [];
  let current = new Date(start);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};


// =======================
// CREATE ACCOMODATION
// =======================
export const createAccomodation = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsorId = req.sponsor._id;

    const {
      eventRegistrationId,
      checkinDateTime,
      checkoutDateTime,
    } = req.body;

    if (!checkinDateTime || !checkoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkin and checkout datetime are required",
      });
    }

    const checkin = new Date(checkinDateTime);
    const checkout = new Date(checkoutDateTime);

    if (checkin >= checkout) {
      return res.status(400).json({
        success: false,
        message: "Checkout must be after checkin",
      });
    }

    // ===============================
    // GET ALL SPONSOR QUOTAS
    // ===============================
    const quotaRecord = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    });

    if (!quotaRecord) {
      return res.status(400).json({
        success: false,
        message: "No accommodation quota assigned",
      });
    }

    // ===============================
    // LOAD ALL ROOMS IN ONE QUERY
    // ===============================
    const roomIds = quotaRecord.quotas.map(q => q.quotaId);

    const rooms = await AddRoom.find({
      _id: { $in: roomIds }
    }).populate("hotelId");

    const roomMap = {};
    rooms.forEach(r => {
      roomMap[r._id.toString()] = r;
    });

    // ===============================
    // NORMALIZE DATES
    // ===============================
    const normalize = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    let startDate = normalize(checkin);
    let endDate = normalize(checkout);

    // ===============================
    // HANDLE EARLY CHECKIN
    // ===============================
    const hotel = rooms[0].hotelId;

    const [checkinHour] = hotel.checkinTime.split(":").map(Number);
    const [checkoutHour] = hotel.checkoutTime.split(":").map(Number);

    if (checkin.getHours() < checkinHour) {
      startDate.setDate(startDate.getDate() - 1);
    }

    if (checkout.getHours() > checkoutHour) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // ===============================
    // GENERATE DATES
    // ===============================
    const dates = [];
    let current = new Date(startDate);

    while (current < endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const accomodationDays = [];

    // ===============================
    // VALIDATE EACH DATE
    // ===============================
    for (let date of dates) {

      // find room for this date
      const room = rooms.find(r =>
        r.checkinDate.toISOString() === date.toISOString()
      );

      if (!room) {
        return res.status(400).json({
          success: false,
          message: `No room available for ${date.toDateString()}`,
        });
      }

      const quotaItem = quotaRecord.quotas.find(
        q => q.quotaId.toString() === room._id.toString()
      );

      if (!quotaItem) {
        return res.status(400).json({
          success: false,
          message: `No quota for ${date.toDateString()}`,
        });
      }

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: { date }
        }
      });

      if (used >= quotaItem.numberOfQuota) {
        return res.status(400).json({
          success: false,
          message: `Quota exceeded for ${date.toDateString()}`,
        });
      }

      accomodationDays.push({
        date,
        quotaId: room._id,
        hotelId: room.hotelId._id
      });
    }

    // ===============================
    // CREATE
    // ===============================
    const booking = await Accomodation.create({
      eventId,
      sponsorId,
      eventRegistrationId,
      checkinDateTime: checkin,
      checkoutDateTime: checkout,
      accomodationDays
    });

    return res.status(201).json({
      success: true,
      message: "Accommodation booked successfully",
      data: booking,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};