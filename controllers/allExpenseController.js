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
      baseAmount,
      unit,
      unitType,
      gstTax,
    } = req.body;

    // Check Event Exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validation
    if (
      !expenseCategoryId ||
      !name ||
      baseAmount == null ||
      unit == null ||
      !unitType ||
      gstTax == null
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (baseAmount < 0 || unit < 0 || gstTax < 0) {
      return res.status(400).json({
        message: "Values cannot be negative",
      });
    }

    const category = await ExpenseCategory.findById(expenseCategoryId);
    if (!category) {
      return res.status(400).json({
        message: "Invalid expense category",
      });
    }

    const duplicate = await AllExpense.findOne({
      eventId,
      expenseCategoryId,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Expense already exists for this event and category",
      });
    }
    //  Calculations
    const totalAmountWithoutGst = baseAmount * unit;
    const gstAmount = (totalAmountWithoutGst * gstTax) / 100;
    const totalAmountWithGst = totalAmountWithoutGst + gstAmount;

    const expense = await AllExpense.create({
      eventId,
      expenseCategoryId,
      name,
      baseAmount,
      unit,
      unitType,
      gstTax,
      totalAmountWithoutGst,
      gstAmount,
      totalAmountWithGst,
    });

    return res.status(201).json({
      success: true,
      message: "All Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create AllExpense error:", error);
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
      .populate("eventId", "eventName startDateTime endDateTime")
      .populate("expenseCategoryId", "expenseCategoryName")
      .sort({ createdAt: -1 })
      .lean();

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


      totalAmount += item.totalAmountWithoutGst;
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
      grouped[catId].totalAmount += item.totalAmountWithoutGst;
      grouped[catId].totalGstAmount += item.gstAmount;

      grouped[catId].expenses.push({
        _id: item._id,
        name: item.name,
        baseAmount: item.baseAmount,
        unit: item.unit,
        unitType: item.unitType,
        gstTax: item.gstTax,
        totalAmountWithoutGst: item.totalAmountWithoutGst,
        gstAmount: item.gstAmount,
        totalAmountWithGst: item.totalAmountWithGst,
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

    // ❌ Restrict fields
    if (req.body.expenseCategoryId || req.body.name) {
      return res.status(400).json({
        message: "expenseCategoryId and name cannot be updated",
      });
    }

    const {
      baseAmount,
      unit,
      unitType,
      gstTax,
    } = req.body;

    //  Prevent empty update
    if (
      baseAmount == null &&
      unit == null &&
      unitType === undefined &&
      gstTax == null
    ) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    //  Negative value validation
    if (
      (baseAmount != null && baseAmount < 0) ||
      (unit != null && unit < 0) ||
      (gstTax != null && gstTax < 0)
    ) {
      return res.status(400).json({
        message: "Values cannot be negative",
      });
    }

    // Update allowed fields
    if (baseAmount != null) expense.baseAmount = baseAmount;
    if (unit != null) expense.unit = unit;
    if (unitType !== undefined) expense.unitType = unitType;
    if (gstTax != null) expense.gstTax = gstTax;

    //  Recalculate using updated values
    const finalBaseAmount = expense.baseAmount;
    const finalUnit = expense.unit;
    const finalGstTax = expense.gstTax;

    const totalAmountWithoutGst = finalBaseAmount * finalUnit;
    const gstAmount = (totalAmountWithoutGst * finalGstTax) / 100;
    const totalAmountWithGst = totalAmountWithoutGst + gstAmount;

    expense.totalAmountWithoutGst = totalAmountWithoutGst;
    expense.gstAmount = gstAmount;
    expense.totalAmountWithGst = totalAmountWithGst;

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "All Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Update AllExpense error:", error);
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