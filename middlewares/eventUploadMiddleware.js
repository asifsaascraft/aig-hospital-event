// middlewares/eventUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";

export const eventUpload = () => {
  return (req, res, next) => {
    try {
      const storage = multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          cb(
            null,
            `event-registration/${req.user._id}/${Date.now()}-${file.originalname}`
          );
        },
      });

      multer({ storage }).any()(req, res, next);
    } catch (error) {
      console.error("Event Upload Middleware Error:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  };
};
