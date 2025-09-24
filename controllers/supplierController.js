// controllers/supplierController.js
import Supplier from "../models/Supplier.js";

// =======================
// Get all suppliers (public for logged-in users)
// =======================
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
      error: error.message,
    });
  }
};

// =======================
// Get single supplier by ID (public for logged-in users)
// =======================
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier",
      error: error.message,
    });
  }
};

// =======================
// Create supplier (admin only)
// =======================
export const createSupplier = async (req, res) => {
  try {
    const {
      supplierName,
      services,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    // Validate required fields
    if (
      !supplierName ||
      !services ||
      !contactPersonName ||
      !contactPersonEmail ||
      !contactPersonMobile ||
      !status
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be provided" });
    }

    //  Check if email already exists
    const existingEmail = await Supplier.findOne({ contactPersonEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    //  Check if mobile already exists
    const existingMobile = await Supplier.findOne({ contactPersonMobile });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: "Mobile already exists" });
    }

    const newSupplier = await Supplier.create({
      supplierName,
      services,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    });

    res.status(201).json({ success: true, data: newSupplier });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create supplier",
      error: error.message,
    });
  }
};

// =======================
// Update supplier (admin only)
// =======================
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplierName,
      services,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    //  Check email uniqueness (exclude current supplier)
    if (contactPersonEmail) {
      const existingEmail = await Supplier.findOne({
        contactPersonEmail,
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
    }

    //  Check mobile uniqueness (exclude current supplier)
    if (contactPersonMobile) {
      const existingMobile = await Supplier.findOne({
        contactPersonMobile,
        _id: { $ne: id },
      });
      if (existingMobile) {
        return res.status(400).json({ success: false, message: "Mobile already exists" });
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { supplierName, services, contactPersonName, contactPersonEmail, contactPersonMobile, status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSupplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.json({ success: true, data: updatedSupplier });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update supplier",
      error: error.message,
    });
  }
};

// =======================
// Delete supplier (admin only)
// =======================
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByIdAndDelete(id);

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
};
