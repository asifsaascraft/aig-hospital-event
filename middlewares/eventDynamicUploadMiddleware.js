// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";

export const dynamicEventUpload = () => {
  return async (req, res, next) => {
    try {
      const registrationSlabId = req.query.registrationSlabId;
      
      if (!registrationSlabId) {
        // No slabId → No dynamic upload → allow form normally
        return multer({ storage: multer.memoryStorage() }).any()(req, res, next);
      }

      const slab = await RegistrationSlab.findById(registrationSlabId);
      if (!slab) return next();

      const uploadFields = slab.additionalFields?.filter(f => f.type === "upload");

      if (!uploadFields || uploadFields.length === 0) {
        // Parse without file upload
        return multer({ storage: multer.memoryStorage() }).any()(req, res, next);
      }

      // If upload required → create fields dynamically
      const s3Fields = uploadFields.map(f => ({
        name: `file_${f.id}`,
        maxCount: 1
      }));

      const storage = multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        contentDisposition: "inline",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const userId = req.user._id.toString();
          const fieldId = file.fieldname.replace("file_", "");
          cb(null, `event-registration/${userId}/field-${fieldId}-${Date.now()}-${file.originalname}`);
        }
      });

      return multer({ storage }).fields(s3Fields)(req, res, next);

    } catch (error) {
      console.error("Dynamic Upload Final Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
