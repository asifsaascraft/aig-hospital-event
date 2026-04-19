import ExpenseCategory from "../models/ExpenseCategory.js";

// =======================
// Get all expense categories (public)
// =======================
export const getExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense categories",
      error: error.message,
    });
  }
};

// =======================
// Get only ACTIVE expense categories (public)
// =======================
export const getActiveExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ status: "Active" })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active expense categories",
      error: error.message,
    });
  }
};

// =======================
// Create expense category (event admin only)
// =======================
export const createExpenseCategory = async (req, res) => {
  try {
    const { expenseCategoryName, status } = req.body;

    // validation
    if (!expenseCategoryName) {
      return res.status(400).json({
        success: false,
        message: "Expense category name is required",
      });
    }

    // prevent duplicate
    const existing = await ExpenseCategory.findOne({
      expenseCategoryName: { $regex: new RegExp(`^${expenseCategoryName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Expense category already exists",
      });
    }

    const category = await ExpenseCategory.create({
      expenseCategoryName,
      status,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create expense category",
      error: error.message,
    });
  }
};

// =======================
// Update expense category (event admin only)
// =======================
export const updateExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseCategoryName, status } = req.body;

    // check duplicate (exclude current)
    if (expenseCategoryName) {
      const existing = await ExpenseCategory.findOne({
        expenseCategoryName,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Expense category name already exists",
        });
      }
    }

    const category = await ExpenseCategory.findByIdAndUpdate(
      id,
      { expenseCategoryName, status },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update expense category",
      error: error.message,
    });
  }
};

// =======================
// Delete expense category (event admin only)
// =======================
export const deleteExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ExpenseCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }

    res.json({
      success: true,
      message: "Expense category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expense category",
      error: error.message,
    });
  }
};