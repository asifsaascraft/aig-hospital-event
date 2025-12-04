import Payment from "../models/Payment.js";

/**
 * Utility function to fetch paid payments + total amount
 */
const getSummary = async (eventId, category, res) => {
  try {
    const payments = await Payment.find({
      eventId,
      paymentCategory: category,
      status: "paid",
    });

    // Calculate total amount
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get current month and year
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter payments for current month
    const currentMonthPayments = payments.filter(p => {
      const date = new Date(p.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Calculate current month total amount
    const currentMonthAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);


    return res.status(200).json({
      success: true,
      category,
      totalAmount,
      currentMonthAmount
    });

  } catch (error) {
    console.error("Event Admin Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/** ================================
 * 1. Event Registration Summary
 * ================================ */
export const getEventRegistrationSummary = (req, res) => {
  return getSummary(req.params.eventId, "Event Registration", res);
};

/** ================================
 * 2. Accompany Summary
 * ================================ */
export const getAccompanySummary = (req, res) => {
  return getSummary(req.params.eventId, "Accompany", res);
};

/** ================================
 * 3. Workshop Summary
 * ================================ */
export const getWorkshopSummary = (req, res) => {
  return getSummary(req.params.eventId, "Workshop", res);
};

/** ================================
 * 4. Banquet Summary
 * ================================ */
export const getBanquetSummary = (req, res) => {
  return getSummary(req.params.eventId, "Banquet", res);
};
