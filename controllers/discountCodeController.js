// controllers/discountCodeController.js
import DiscountCode from "../models/DiscountCode.js";
import Event from "../models/Event.js";

// =======================
// Create Discount Code (EventAdmin Only)
// =======================
export const createDiscountCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      codeName,
      discountType,
      discount,
      redemptionLimit,
      startDate,
      endDate,
      startTime,
      endTime,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid Discount Type. Must be 'percentage' or 'fixed'.",
      });
    }

    // Validate discount amount
    if (discount <= 0) {
      return res.status(400).json({
        message: "Discount value must be greater than 0.",
      });
    }

    // Create new discount code
    const discountCode = await DiscountCode.create({
      eventId,
      codeName,
      discountType,
      discount,
      redemptionLimit,
      startDate,
      endDate,
      startTime,
      endTime,
    });

    res.status(201).json({
      success: true,
      message: "Discount code created successfully",
      data: discountCode,
    });
  } catch (error) {
    console.error("Create discount code error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Discount Codes by Event ID (Public/User)
// =======================
export const getDiscountCodesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const discountCodes = await DiscountCode.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Discount codes fetched successfully",
      data: discountCodes,
    });
  } catch (error) {
    console.error("Get discount codes error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active (Valid) Discount Codes
// =======================
export const getActiveDiscountCodesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const discountCodes = await DiscountCode.find({ eventId });

    const now = new Date();

    const activeDiscountCodes = discountCodes.filter((dc) => {
      try {
        const [day, month, year] = dc.endDate.split("/");
        const endDateTime = new Date(`${year}-${month}-${day} ${dc.endTime}`);
        return endDateTime > now;
      } catch {
        return false;
      }
    });

    res.status(200).json({
      success: true,
      message: "Active discount codes fetched successfully",
      data: activeDiscountCodes,
    });
  } catch (error) {
    console.error("Get active discount codes error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Discount Code (EventAdmin Only)
// =======================
export const updateDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codeName,
      discountType,
      discount,
      redemptionLimit,
      startDate,
      endDate,
      startTime,
      endTime,
    } = req.body;

    const discountCode = await DiscountCode.findById(id);
    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    // Validate discount type if provided
    if (discountType && !["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid Discount Type. Must be 'percentage' or 'fixed'.",
      });
    }

    // Update only provided fields
    if (codeName) discountCode.codeName = codeName;
    if (discountType) discountCode.discountType = discountType;
    if (discount !== undefined) discountCode.discount = discount;
    if (redemptionLimit !== undefined)
      discountCode.redemptionLimit = redemptionLimit;
    if (startDate) discountCode.startDate = startDate;
    if (endDate) discountCode.endDate = endDate;
    if (startTime) discountCode.startTime = startTime;
    if (endTime) discountCode.endTime = endTime;

    await discountCode.save();

    res.status(200).json({
      success: true,
      message: "Discount code updated successfully",
      data: discountCode,
    });
  } catch (error) {
    console.error("Update discount code error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Discount Code (EventAdmin Only)
// =======================
export const deleteDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;

    const discountCode = await DiscountCode.findById(id);
    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    await discountCode.deleteOne();

    res.status(200).json({
      success: true,
      message: "Discount code deleted successfully",
    });
  } catch (error) {
    console.error("Delete discount code error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
