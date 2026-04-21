import ExpenseHead from "../models/ExpenseHead.js";
import ExpenseCategory from "../models/ExpenseCategory.js";

// =======================
// Get all expense heads (public)
// =======================
export const getExpenseHeads = async (req, res) => {
  try {
    const heads = await ExpenseHead.find()
      .populate("expenseCategoryId", "expenseCategoryName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: heads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense heads",
      error: error.message,
    });
  }
};

// =======================
// Get only ACTIVE expense heads (public)
// =======================
export const getActiveExpenseHeads = async (req, res) => {
  try {
    const heads = await ExpenseHead.find({ status: "Active" })
      .populate("expenseCategoryId", "expenseCategoryName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: heads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active expense heads",
      error: error.message,
    });
  }
};

// =======================
// Create expense head (event admin)
// =======================
export const createExpenseHead = async (req, res) => {
  try {
    const {
      expenseCategoryId,
      name,
      amount,
      unitType,
      gstTax,
      status,
    } = req.body;

    // validation
    if (!expenseCategoryId || !name || !amount || !unitType || gstTax === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check category exists
    const category = await ExpenseCategory.findById(expenseCategoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense category",
      });
    }

    // duplicate check
    const existing = await ExpenseHead.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      expenseCategoryId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Expense head already exists in this category",
      });
    }

    //  GST Calculation
    const gstAmount = (amount * gstTax) / 100;
    const amountWithGst = amount + gstAmount;

    const head = await ExpenseHead.create({
      expenseCategoryId,
      name,
      amount,
      unitType,
      gstTax,
      gstAmount,
      amountwithGst: amountWithGst,
      status,
    });

    res.status(201).json({
      success: true,
      data: head,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create expense head",
      error: error.message,
    });
  }
};

// =======================
// Update expense head (event admin)
// =======================
export const updateExpenseHead = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expenseCategoryId,
      name,
      amount,
      unitType,
      gstTax,
      status,
    } = req.body;

    // duplicate check
    if (name && expenseCategoryId) {
      const existing = await ExpenseHead.findOne({
        name,
        expenseCategoryId,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Expense head already exists in this category",
        });
      }
    }

    // validate category
    if (expenseCategoryId) {
      const category = await ExpenseCategory.findById(expenseCategoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Invalid expense category",
        });
      }
    }

    const existing = await ExpenseHead.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense head not found",
      });
    }

    let updateData = {};

    if (expenseCategoryId !== undefined) updateData.expenseCategoryId = expenseCategoryId;
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (unitType !== undefined) updateData.unitType = unitType;
    if (gstTax !== undefined) updateData.gstTax = gstTax;
    if (status !== undefined) updateData.status = status;


    // Recalculate GST if either amount OR gstTax changes
    if (amount !== undefined || gstTax !== undefined) {
      const finalAmount = amount !== undefined ? amount : existing.amount;
      const finalGst = gstTax !== undefined ? gstTax : existing.gstTax;

      const gstAmount = (finalAmount * finalGst) / 100;
      updateData.gstAmount = gstAmount;
      updateData.amountwithGst = finalAmount + gstAmount;
    }

    const head = await ExpenseHead.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!head) {
      return res.status(404).json({
        success: false,
        message: "Expense head not found",
      });
    }

    res.json({
      success: true,
      data: head,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update expense head",
      error: error.message,
    });
  }
};

// =======================
// Delete expense head (event admin)
// =======================
export const deleteExpenseHead = async (req, res) => {
  try {
    const { id } = req.params;

    const head = await ExpenseHead.findByIdAndDelete(id);

    if (!head) {
      return res.status(404).json({
        success: false,
        message: "Expense head not found",
      });
    }

    res.json({
      success: true,
      message: "Expense head deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expense head",
      error: error.message,
    });
  }
};