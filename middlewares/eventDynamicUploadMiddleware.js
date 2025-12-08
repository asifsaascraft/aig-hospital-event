// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";

export const dynamicEventUpload = () => {
  const tempStorage = multer({ storage: multer.memoryStorage() }).any(); // ALWAYS PARSE BODY FIRST

  return async (req, res, next) => {
    tempStorage(req, res, async function (err) {
      if (err) {
        console.error("Multer temp parsing error:", err);
        return res.status(400).json({ message: "Upload parsing failed" });
      }

      try {
        let registrationSlabId = req.body?.registrationSlabId || req.query?.registrationSlabId;

        if (!registrationSlabId) {
          return next(); // No slab ID, continue request
        }

        const slab = await RegistrationSlab.findById(registrationSlabId);
        if (!slab) return next();

        // filter only upload fields
        const uploadFields = slab.additionalFields?.filter((f) => f.type === "upload");

        // If NO upload fields → Continue without multer S3
        if (!uploadFields || uploadFields.length === 0) {
          return next();
        }

        const s3Fields = uploadFields.map((f) => ({
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
            const userId = req.user?._id.toString();
            const fieldId = file.fieldname.replace("file_", "");
            const fileName = `event-registration/${userId}/field-${fieldId}-${Date.now()}-${file.originalname}`;
            cb(null, fileName);
          }
        });

        const dynamicUpload = multer({ storage }).fields(s3Fields);

        dynamicUpload(req, res, function (err2) {
          if (err2) {
            console.error("Upload error:", err2);
            return res.status(400).json({ message: "File upload error", error: err2.message });
          }
          next();
        });

      } catch (error) {
        console.error("Dynamic upload middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  };
};
