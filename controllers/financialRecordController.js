
import mongoose from "mongoose";
import Event from "../models/Event.js";
import ExpenseRecord from "../models/ExpenseRecord.js";
import IncomeRecord from "../models/IncomeRecord.js";

// GET Combined Income and Expense Records by Event
export const getFinancialRecordsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventId",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Fetch income and expense records together
    const [expenses, incomes] = await Promise.all([
      ExpenseRecord.find({ eventId }).lean(),
      IncomeRecord.find({ eventId })
        .populate("sponsorId", "sponsorName contactPersonName email mobile")
        .lean(),
    ]);

    // Combine both collections into one array
    const combinedRecords = [
      ...expenses.map((expense) => ({
        ...expense,
        type: "expense",
        recordAmount: expense.amount,
      })),

      ...incomes.map((income) => ({
        ...income,
        type: "income",
        recordAmount: income.amountReceived,
      })),
    ].sort(
      (a, b) =>
        new Date(b.dateTime).getTime() -
        new Date(a.dateTime).getTime(),
    );

    return res.status(200).json({
      success: true,
      message: "Financial records fetched successfully",
      count: combinedRecords.length,
      data: combinedRecords,
    });
  } catch (error) {
    console.error("Get financial records error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
