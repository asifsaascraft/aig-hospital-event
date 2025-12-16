// middlewares/slabUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";

export const slabUpload = () => {
  return async (req, res, next) => {
    try {
      const registrationSlabId = req.query.registrationSlabId;

      if (!registrationSlabId) {
        return multer().none()(req, res, next);
      }

      const slab = await RegistrationSlab.findById(registrationSlabId);

      if (!slab || !slab.needAdditionalInfo) {
        return multer().none()(req, res, next);
      }

      const uploadFields = slab.additionalFields
        .filter((f) => f.type === "upload")
        .map((f) => ({
          name: `file_${f.id}`,
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
            `event-registration/slab/${req.user._id}/${Date.now()}-${file.originalname}`
          );
        },
      });

      multer({ storage }).fields(uploadFields)(req, res, next);
    } catch (err) {
      console.error("Slab Upload Error:", err);
      res.status(500).json({ message: "Slab upload failed" });
    }
  };
};
