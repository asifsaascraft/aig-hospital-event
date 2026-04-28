import Income from "../models/Income.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Income (EventAdmin)
// =======================
export const createIncome = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, purposedAmount, receivedAmount, note, dateTime } = req.body;

    // Validate required
    if (!sponsorId || !purposedAmount || !dateTime) {
      return res.status(400).json({
        message: "sponsorId, purposedAmount and dateTime are required",
      });
    }

    // Check Event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check Sponsor
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    //  Prevent duplicate check
    const existing = await Income.findOne({ eventId, sponsorId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Income already exists for this sponsor in this event",
      });
    }

    const income = await Income.create({
      eventId,
      sponsorId,
      purposedAmount,
      receivedAmount,
      note,
      dateTime: new Date(dateTime), // ensure Date format
    });

    res.status(201).json({
      success: true,
      message: "Income created successfully",
      data: income,
    });

  } catch (error) {
    console.error("Create income error:", error);

    // Handle duplicate index error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate income entry for this sponsor and event",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get All Income by Event (Public)
// =======================
export const getIncomeByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const incomes = await Income.find({ eventId })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: incomes,
    });

  } catch (error) {
    console.error("Get income error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Update Income (EventAdmin)
// =======================
export const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, purposedAmount, receivedAmount, note, dateTime } = req.body;

    const income = await Income.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    if (sponsorId) {
      const sponsor = await Sponsor.findById(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      income.sponsorId = sponsorId;
    }

    if (purposedAmount !== undefined) income.purposedAmount = purposedAmount;
    if (receivedAmount !== undefined) income.receivedAmount = receivedAmount;
    if (note !== undefined) income.note = note;
    if (dateTime) income.dateTime = new Date(dateTime);

    await income.save();

    res.status(200).json({
      success: true,
      message: "Income updated successfully",
      data: income,
    });

  } catch (error) {
    console.error("Update income error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Delete Income (EventAdmin)
// =======================
export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    await income.deleteOne();

    res.status(200).json({
      success: true,
      message: "Income deleted successfully",
    });

  } catch (error) {
    console.error("Delete income error:", error);
    res.status(500).json({ message: "Server error" });
  }
};