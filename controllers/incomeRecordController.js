import IncomeRecord from "../models/IncomeRecord.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Income Record (EventAdmin Only)
// =======================
export const createIncomeRecord = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { sponsorId, amountReceived, utrNumber, date } = req.body;

    //  Check Event Exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Check Sponsor Exists
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    //  Manual validation
    if (!sponsorId || !amountReceived || !utrNumber || !date) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    const income = await IncomeRecord.create({
      eventId,
      sponsorId,
      amountReceived,
      utrNumber,
      date,
    });

    return res.status(201).json({
      success: true,
      message: "Income record created successfully",
      data: income,
    });
  } catch (error) {
    console.error("Create Income error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Income Records by Event (Public)
// =======================
export const getIncomeRecordsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const incomes = await IncomeRecord.find({ eventId })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Income records fetched successfully",
      data: incomes,
    });
  } catch (error) {
    console.error("Get Income error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Income Record (EventAdmin)
// =======================
export const updateIncomeRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await IncomeRecord.findById(id);
    if (!income) {
      return res.status(404).json({
        message: "Income record not found",
      });
    }

    const { sponsorId, amountReceived, utrNumber, date } = req.body;

    //  Validate sponsor if updating
    if (sponsorId) {
      const sponsor = await Sponsor.findById(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      income.sponsorId = sponsorId;
    }

    if (amountReceived) income.amountReceived = amountReceived;
    if (utrNumber) income.utrNumber = utrNumber;
    if (date) income.date = date;

    await income.save();

    return res.status(200).json({
      success: true,
      message: "Income record updated successfully",
      data: income,
    });
  } catch (error) {
    console.error("Update Income error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Income Record (EventAdmin)
// =======================
export const deleteIncomeRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await IncomeRecord.findById(id);
    if (!income) {
      return res.status(404).json({
        message: "Income record not found",
      });
    }

    await income.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Income record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Income error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};