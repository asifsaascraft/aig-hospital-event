import Contact from "../models/Contact.js";
import Event from "../models/Event.js";
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import buildSearchQuery from '../utils/search.js'
// =======================
// Create Contact (EventAdmin)
// =======================
export const createContact = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { name, role, email, mobile, description } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const contact = await Contact.create({
      eventId,
      name,
      role,
      email,
      mobile,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create Contact Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

 // =======================
 // Get All Contacts By Event
 // =======================
 export const getContactsByEvent = async (req, res) => {
   try {
     const { eventId } = req.params;

     // Pagination
     const { page, limit, skip } = getPagination(req);

     // Search
     const searchQuery = buildSearchQuery(req, [
       "name",
       "role",
       "email",
       "mobile",
     ]);

     // Final Query
     const query = {
       eventId,
       ...searchQuery,
     };

     // MongoDB
     const [contacts, total] = await Promise.all([
       Contact.find(query)
         .skip(skip)
         .limit(limit),

       Contact.countDocuments(query),
     ]);

     // Pagination
     const pagination = buildPaginationMeta(
       total,
       page,
       limit,
     );

     return res.status(200).json({
       success: true,
       message: "Contacts fetched successfully",
       data: contacts,
       pagination,
     });
   } catch (error) {
     console.error(error);

     return res.status(500).json({
       success: false,
       message: "Server Error",
     });
   }
 };

// =======================
// Get Contact By Id
// =======================
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact fetched successfully",
      data: contact,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Contact
// =======================
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, role, email, mobile, description } = req.body;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    if (name) contact.name = name;
    if (role) contact.role = role;
    if (email) contact.email = email;
    if (mobile) contact.mobile = mobile;
    if (description) contact.description = description;

    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Contact
// =======================
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    await contact.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
