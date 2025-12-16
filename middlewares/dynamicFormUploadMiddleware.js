// middlewares/dynamicFormUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import DynamicRegForm from "../models/DynamicRegForm.js";

export const dynamicFormUpload = () => {
  return async (req, res, next) => {
    try {
      const { eventId } = req.params;

      const form = await DynamicRegForm.findOne({ eventId });

      if (!form || form.fields.length === 0) {
        return multer().none()(req, res, next);
      }

      const uploadFields = form.fields
        .filter((f) => f.type === "file")
        .map((f) => ({
          name: `file_dyn_${f.id}`,
          maxCount: 1,
        }));

      if (uploadFields.length === 0) {
        return multer().none()(req, res, next);
      }

      const storage = multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          cb(
            null,
            `event-registration/dynamic/${req.user._id}/${Date.now()}-${file.originalname}`
          );
        },
      });

      multer({ storage }).fields(uploadFields)(req, res, next);
    } catch (err) {
      console.error("Dynamic Form Upload Error:", err);
      res.status(500).json({ message: "Dynamic form upload failed" });
    }
  };
};
