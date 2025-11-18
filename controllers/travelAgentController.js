import TravelAgent from "../models/TravelAgent.js";
import Event from "../models/Event.js";

// =======================
// Create Travel Agent (EventAdmin Only)
// =======================
export const createTravelAgent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { agentName, email, mobile, company, city, status } = req.body;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Check if email already exists
    const existingEmail = await TravelAgent.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create Travel Agent
    const agent = await TravelAgent.create({
      eventId,
      agentName,
      email,
      mobile,
      company,
      city,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Travel Agent created successfully",
      data: agent,
    });
  } catch (error) {
    console.error("Create Travel Agent error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Travel Agents by Event ID
// =======================
export const getTravelAgentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const agents = await TravelAgent.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Travel Agents fetched successfully",
      data: agents,
    });
  } catch (error) {
    console.error("Get Travel Agents error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Travel Agents by Event
// =======================
export const getActiveTravelAgentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const agents = await TravelAgent.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Travel Agents fetched successfully",
      data: agents,
    });
  } catch (error) {
    console.error("Get Active Travel Agents error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Travel Agent (EventAdmin Only)
// =======================
export const updateTravelAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentName, email, mobile, company, city, status } = req.body;

    const agent = await TravelAgent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: "Travel Agent not found" });
    }

    if (agentName) agent.agentName = agentName;
    if (email) agent.email = email;
    if (mobile) agent.mobile = mobile;
    if (company) agent.company = company;
    if (city) agent.city = city;
    if (status) agent.status = status;

    await agent.save();

    res.status(200).json({
      success: true,
      message: "Travel Agent updated successfully",
      data: agent,
    });
  } catch (error) {
    console.error("Update Travel Agent error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Travel Agent (EventAdmin Only)
// =======================
export const deleteTravelAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await TravelAgent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: "Travel Agent not found" });
    }

    await agent.deleteOne();

    res.status(200).json({
      success: true,
      message: "Travel Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete Travel Agent error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
