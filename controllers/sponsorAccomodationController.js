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

    const {
      sponsorId,
      eventRegistrationId,
      checkinDateTime,
      checkoutDateTime,
    } = req.body;

    if (!checkinDateTime || !checkoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkin, checkout date and time are required",
      });
    }

    const checkin = new Date(checkinDateTime);
    const checkout = new Date(checkoutDateTime);

    if (checkin >= checkout) {
      return res.status(400).json({
        success: false,
        message: "Checkout amust be after checkin",
      });
    }

    // ===============================
    // GET QUOTA RECORD
    // ===============================
    const quotaRecord = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    });

    if (!quotaRecord) {
      return res.status(400).json({
        success: false,
        message: "No accommodation quota assigned to this sponsor",
      });
    }

    // ===============================
    // GET HOTEL FROM FIRST QUOTA
    // ===============================
    const firstRoom = await AddRoom.findById(
      quotaRecord.quotas[0].quotaId
    ).populate("hotelId");

    const hotel = firstRoom.hotelId;

    const hotelCheckin = parseTime(hotel.checkinTime);
    const hotelCheckout = parseTime(hotel.checkoutTime);

    const userCheckin = {
      h: checkin.getHours(),
      m: checkin.getMinutes(),
    };

    const userCheckout = {
      h: checkout.getHours(),
      m: checkout.getMinutes(),
    };

    // ===============================
    // VALIDATE HOTEL TIME
    // ===============================
    if (
      userCheckin.h < hotelCheckin.h ||
      (userCheckin.h === hotelCheckin.h &&
        userCheckin.m < hotelCheckin.m)
    ) {
      return res.status(400).json({
        success: false,
        message: `Check-in allowed only after ${hotel.checkinTime}`,
      });
    }

    if (
      userCheckout.h > hotelCheckout.h ||
      (userCheckout.h === hotelCheckout.h &&
        userCheckout.m > hotelCheckout.m)
    ) {
      return res.status(400).json({
        success: false,
        message: `Checkout must be before ${hotel.checkoutTime}`,
      });
    }

    // ===============================
    // GENERATE DATES (NIGHTS)
    // ===============================
    const startDate = normalizeDate(checkin);
    const endDate = normalizeDate(checkout);

    const dates = getDatesBetween(startDate, endDate);

    if (dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one night booking required",
      });
    }

    const accomodationDays = [];

    // ===============================
    // VALIDATE EACH DATE
    // ===============================
    for (let date of dates) {
      const room = await AddRoom.findOne({
        eventId,
        checkinDate: date,
      });

      if (!room) {
        return res.status(400).json({
          success: false,
          message: `No accommodation available for ${date.toDateString()}`,
        });
      }

      const quotaItem = quotaRecord.quotas.find(
        (q) => q.quotaId.toString() === room._id.toString()
      );

      if (!quotaItem) {
        return res.status(400).json({
          success: false,
          message: `No quota assigned for ${date.toDateString()}`,
        });
      }

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: { date },
        },
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
      });
    }

    // ===============================
    // CREATE RECORD
    // ===============================
    const booking = await Accomodation.create({
      eventId,
      sponsorId,
      eventRegistrationId,
      checkinDateTime: checkin,
      checkoutDateTime: checkout,
      accomodationDays,
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
      message: "Internal server error",
      error: error.message,
    });
  }
};