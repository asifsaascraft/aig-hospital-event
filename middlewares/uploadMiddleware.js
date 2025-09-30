// middlewares/uploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";

export const createUploader = (folder) => {
  const storage = multerS3({
    s3, // AWS SDK v3 S3Client
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read", // makes files accessible via public URL
    key: (req, file, cb) => {
      const fileName = `${folder}/${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
  });

  return multer({ storage });
};

// Export specific uploaders
export const uploadVenueImage = createUploader("venues");
export const uploadEventImage = createUploader("events");
export const uploadHotelImage = createUploader("hotels");
