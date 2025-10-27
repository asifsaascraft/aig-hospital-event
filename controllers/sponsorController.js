import Sponsor from "../models/Sponsor.js";
import bcrypt from "bcryptjs";

//  Generate strong random password (8–14 chars)
function generateStrongPassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const symbols = "!@#$%^&*";
    const all = upper + lower + digits + symbols;
    const length = Math.floor(Math.random() * (14 - 8 + 1)) + 8;

    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split("").sort(() => Math.random() - 0.5).join("");
}

// =======================
// Get all sponsors by Event ID (Public/User)
// =======================
export const getSponsorsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const sponsors = await Sponsor.find({ eventId }).sort({ createdAt: -1 }).populate("eventId booth");
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
            booth,
            sponsorCategory,
            status,
        } = req.body;

        if (!eventId || !sponsorName || !contactPersonName || !email || !sponsorCategory) {
            return res.status(400).json({
                success: false,
                message: "Required fields: eventId, sponsorName, contactPersonName, email, sponsorCategory",
            });
        }

        // Check if sponsor email already exists
        const existingSponsor = await Sponsor.findOne({ email });
        if (existingSponsor) {
            return res.status(400).json({
                success: false,
                message: "Sponsor with this email already exists",
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
            booth,
            sponsorCategory,
            status: status || "Active",
        });


        // Return plain password (for eventAdmin to note or send)
        res.status(201).json({
            success: true,
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
