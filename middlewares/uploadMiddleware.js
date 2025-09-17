// middlewares/uploadMiddleware.js
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

/**
 * Reusable upload function
 * @param {string} folder - Cloudinary folder name (e.g. "venues", "events")
 */
export const createUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder, // dynamic folder name
      allowed_formats: ["jpg", "jpeg", "png"],
    },
  });

  return multer({ storage });
};

// Export specific uploaders for convenience
export const uploadVenueImage = createUploader("venues");
export const uploadEventImage = createUploader("events");
