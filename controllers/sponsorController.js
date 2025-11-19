import Sponsor from "../models/Sponsor.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";



// =======================
// Get all sponsors by Event ID (Public/User)
// =======================
export const getSponsorsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const sponsors = await Sponsor.find({ eventId }).sort({ createdAt: -1 }).populate("eventId sponsorBooth");
        res.json({ success: true, data: sponsors });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch sponsors",
            error: error.message,
        });
    }
};

// =======================
// Get active sponsors by Event ID (Public/User)
// =======================
export const getActiveSponsorsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const sponsors = await Sponsor.find({
            eventId,
            status: "Active",
        })
            .sort({ createdAt: -1 })
            .populate("eventId sponsorBooth");

        res.json({
            success: true,
            data: sponsors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch active sponsors",
            error: error.message,
        });
    }
};


// =======================
// Create sponsor (eventAdmin only)
// =======================
export const createSponsor = async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            sponsorName,
            contactPersonName,
            email,
            mobile,
            additionalEmail,
            gstNumber,
            companyAddress,
            sponsorBooth,
            sponsorCategory,
            status,
        } = req.body;

        if (
            !eventId ||
            !sponsorName ||
            !contactPersonName ||
            !email ||
            !mobile ||
            !companyAddress ||
            !sponsorBooth ||
            !sponsorCategory
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields: eventId, sponsorName, contactPersonName, email, mobile, companyAddress, sponsorBooth, sponsorCategory",
            });
        }

        // Check if an active sponsor with this email already exists
        const existingActiveSponsor = await Sponsor.findOne({
            email,
            status: "Active",
        });

        if (existingActiveSponsor) {
            return res.status(400).json({
                success: false,
                message: "A sponsor with this email is already Active. Please deactivate the existing sponsor before adding a new one."
            });
        }
        //  Handle sponsor image upload (using multer-s3) 
        let sponsorImage = "";
        if (req.file && req.file.location) {
            sponsorImage = req.file.location;

        } else {
            return res.status(400).json({
                success: false,
                message: "Sponsor image is required",
            });
        }
        // Generate password
        const plainPassword = generateStrongPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const sponsor = await Sponsor.create({
            eventId,
            sponsorName,
            sponsorImage,
            contactPersonName,
            email,
            mobile,
            additionalEmail,
            password: hashedPassword,
            plainPassword,
            gstNumber,
            companyAddress,
            sponsorBooth,
            sponsorCategory,
            status: status || "Active",
        });


        // Return plain password (for eventAdmin to note or send)
        res.status(201).json({
            success: true,
            message: "Sponsor created successfully",
            data: sponsor,
            plainPassword,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create sponsor",
            error: error.message,
        });
    }
};

// =======================
// Update sponsor (eventAdmin only)
// =======================
export const updateSponsor = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = { ...req.body };
        // Update sponsor image if a new one is uploaded 

        if (req.file && req.file.location) {
            updatedData.sponsorImage = req.file.location;
        }

        const sponsor = await Sponsor.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        });

        if (!sponsor) {
            return res.status(404).json({
                success: false,
                message: "Sponsor not found",
            });
        }

        res.json({ success: true, data: sponsor });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update sponsor",
            error: error.message,
        });
    }
};

// =======================
// Delete sponsor (eventAdmin only)
// =======================
export const deleteSponsor = async (req, res) => {
    try {
        const { id } = req.params;

        const sponsor = await Sponsor.findByIdAndDelete(id);

        if (!sponsor) {
            return res.status(404).json({
                success: false,
                message: "Sponsor not found",
            });
        }

        res.json({ success: true, message: "Sponsor deleted successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete sponsor",
            error: error.message,
        });
    }
};
