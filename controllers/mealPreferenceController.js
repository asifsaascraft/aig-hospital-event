import MealPreference from "../models/MealPreference.js";
import Event from "../models/Event.js";

// =======================
// Create Meal Preference (EventAdmin Only)
// =======================
export const createMealPreference = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { mealName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new meal preference
    const mealPreference = await MealPreference.create({
      eventId,
      mealName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Meal preference created successfully",
      data: mealPreference,
    });
  } catch (error) {
    console.error("Create meal preference error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Meal Preferences by Event ID (Public/User)
// =======================
export const getMealPreferencesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const meals = await MealPreference.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Meal preferences fetched successfully",
      data: meals,
    });
  } catch (error) {
    console.error("Get meal preferences error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Only Active Meal Preferences by Event ID (Public/User)
// =======================
export const getActiveMealPreferencesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find only active meals for given event
    const activeMeals = await MealPreference.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active meal preferences fetched successfully",
      data: activeMeals,
    });
  } catch (error) {
    console.error("Get active meal preferences error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Update Meal Preference (EventAdmin Only)
// =======================
export const updateMealPreference = async (req, res) => {
  try {
    const { id } = req.params;
    const { mealName, status } = req.body;

    // Find existing meal preference
    const mealPreference = await MealPreference.findById(id);
    if (!mealPreference) {
      return res.status(404).json({ message: "Meal preference not found" });
    }

    // Update fields if provided
    if (mealName) mealPreference.mealName = mealName;
    if (status) mealPreference.status = status;

    await mealPreference.save();

    res.status(200).json({
      success: true,
      message: "Meal preference updated successfully",
      data: mealPreference,
    });
  } catch (error) {
    console.error("Update meal preference error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Meal Preference (EventAdmin Only)
// =======================
export const deleteMealPreference = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPreference = await MealPreference.findById(id);
    if (!mealPreference) {
      return res.status(404).json({ message: "Meal preference not found" });
    }

    await mealPreference.deleteOne();

    res.status(200).json({
      success: true,
      message: "Meal preference deleted successfully",
    });
  } catch (error) {
    console.error("Delete meal preference error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
