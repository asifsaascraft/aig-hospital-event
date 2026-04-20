import AllExpense from "../models/AllExpense.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Event from "../models/Event.js";

// =======================
// Create All Expense (EventAdmin Only)
// =======================
export const createAllExpense = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      expenseCategoryId,
      name,
      amount,
      unit,
      unitType,
      gstAmount,
    } = req.body;

    //  Check Event Exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Required validations
    if (
      !expenseCategoryId ||
      !name ||
      amount == null ||
      unit == null ||
      !unitType ||
      gstAmount == null
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const expense = await AllExpense.create({
      eventId,
      expenseCategoryId,
      name,
      amount,
      unit,
      unitType,
      gstAmount,
    });

    return res.status(201).json({
      success: true,
      message: "All Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create AllExpense error:", error);

    // mongoose validation error
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: errors.join(", ") });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Expenses by Event (Public)
// =======================
export const getAllExpensesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const expenses = await AllExpense.find({ eventId })
      .populate("eventId", "eventName startDate startTime endDate endTime")
      .populate("expenseCategoryId", "expenseCategoryName")
      .sort({ createdAt: -1 });

    if (!expenses.length) {
      return res.status(200).json({
        success: true,
        message: "No expenses found",
        event: null,
        totals: {
          totalAmount: 0,
          totalGstAmount: 0,
          totalAmountWithGst: 0,
        },
        categories: [],
      });
    }

    const event = expenses[0].eventId;

    const grouped = {};

    let totalAmount = 0;
    let totalGstAmount = 0;

    expenses.forEach((item) => {
      const catId = item.expenseCategoryId._id.toString();

      //  ONLY amount 
      totalAmount += item.amount;
      totalGstAmount += item.gstAmount;

      if (!grouped[catId]) {
        grouped[catId] = {
          _id: item.expenseCategoryId._id,
          expenseCategoryName: item.expenseCategoryId.expenseCategoryName,
          totalAmount: 0,
          totalGstAmount: 0,
          totalAmountWithGst: 0,
          expenses: [],
        };
      }

      //  Category totals
      grouped[catId].totalAmount += item.amount;
      grouped[catId].totalGstAmount += item.gstAmount;

      grouped[catId].expenses.push({
        _id: item._id,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        unitType: item.unitType,
        gstAmount: item.gstAmount,
        createdAt: item.createdAt,
      });
    });

    //  Final calculations
    Object.values(grouped).forEach((cat) => {
      cat.totalAmountWithGst = cat.totalAmount + cat.totalGstAmount;
    });

    const totalAmountWithGst = totalAmount + totalGstAmount;

    return res.status(200).json({
      success: true,
      message: "All expenses fetched successfully",
      event,
      totals: {
        totalAmount,
        totalGstAmount,
        totalAmountWithGst,
      },
      categories: Object.values(grouped),
    });

  } catch (error) {
    console.error("Get AllExpense error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update All Expense (EventAdmin)
// =======================
export const updateAllExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await AllExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    const {
      amount,
      unit,
      unitType,
      gstAmount,
    } = req.body;

    //  Prevent updating restricted fields
    if (req.body.expenseCategoryId || req.body.name) {
      return res.status(400).json({
        message: "expenseCategoryId and name cannot be updated",
      });
    }

    //  Update only allowed fields
    if (amount != null) expense.amount = amount;
    if (unit != null) expense.unit = unit;
    if (unitType) expense.unitType = unitType;
    if (gstAmount != null) expense.gstAmount = gstAmount;

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "All Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Update AllExpense error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: errors.join(", ") });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete All Expense (EventAdmin)
// =======================
export const deleteAllExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await AllExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: "All Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete AllExpense error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};