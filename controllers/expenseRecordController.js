import ExpenseRecord from "../models/ExpenseRecord.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";
import IncomeRecord from "../models/IncomeRecord.js";

// =======================
// Create Expense Record (EventAdmin Only)
// =======================
export const createExpenseRecord = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      companyName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      invoiceNumber,
      dateTime,
      amount,
    } = req.body;

    //  Check Event Exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Manual Validations (extra safety)
    if (!companyName || !contactPersonName || !invoiceNumber || !dateTime || !amount) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    // Mobile validation
    if (!/^\d{10}$/.test(contactPersonMobile)) {
      return res.status(400).json({
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(contactPersonEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const expense = await ExpenseRecord.create({
      eventId,
      companyName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      invoiceNumber,
      dateTime: new Date(dateTime), // ensure date format
      amount,
    });

    return res.status(201).json({
      success: true,
      message: "Expense record created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create Expense error:", error);

    //  Handle duplicate key error (unique email/mobile)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        message: `${field} already exists`,
      });
    }

    //  Mongoose validation error
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
// Get All Expense Records by Event (Public)
// =======================
export const getExpenseRecordsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const expenses = await ExpenseRecord.find({ eventId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Expense records fetched successfully",
      data: expenses,
    });
  } catch (error) {
    console.error("Get Expense error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Update Expense Record (EventAdmin)
// =======================
export const updateExpenseRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await ExpenseRecord.findById(id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense record not found",
      });
    }

    const {
      companyName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      invoiceNumber,
      dateTime,
      amount,
    } = req.body;

    if (contactPersonMobile && !/^\d{10}$/.test(contactPersonMobile)) {
      return res.status(400).json({
        message: "Mobile number must be exactly 10 digits",
      });
    }

    if (contactPersonEmail && !/^\S+@\S+\.\S+$/.test(contactPersonEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Update fields
    if (companyName) expense.companyName = companyName;
    if (contactPersonName) expense.contactPersonName = contactPersonName;
    if (contactPersonMobile) expense.contactPersonMobile = contactPersonMobile;
    if (contactPersonEmail) expense.contactPersonEmail = contactPersonEmail;
    if (invoiceNumber) expense.invoiceNumber = invoiceNumber;
    if (dateTime) expense.dateTime = new Date(dateTime);
    if (amount) expense.amount = amount;

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense record updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Update Expense error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        message: `${field} already exists`,
      });
    }

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
// Delete Expense Record (EventAdmin)
// =======================
export const deleteExpenseRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await ExpenseRecord.findById(id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense record not found",
      });
    }

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Expense record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Expense error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// =========================================
// GET Combined Income and Expense Records by Event
// =========================================
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
