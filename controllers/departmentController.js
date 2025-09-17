import Department from "../models/Department.js";

// =======================
// Get all departments (public)
// =======================
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

// =======================
// Create department (admin only)
// =======================
export const createDepartment = async (req, res) => {
  try {
    const { departmentName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    if (!departmentName || !contactPersonName || !contactPersonMobile || !contactPersonEmail) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const department = await Department.create({
      departmentName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      status,
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message,
    });
  }
};

// =======================
// Update department (admin only)
// =======================
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { departmentName, contactPersonName, contactPersonMobile, contactPersonEmail, status },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message,
    });
  }
};

// =======================
// Delete department (admin only)
// =======================
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    res.json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error.message,
    });
  }
};
