// middlewares/uploadMiddleware.js
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "venues",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

export const uploadVenueImage = multer({ storage });
