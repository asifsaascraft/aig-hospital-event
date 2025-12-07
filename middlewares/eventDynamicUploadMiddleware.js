// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";

export const dynamicEventUpload = () => {
  return async (req, res, next) => {
    try {
      // registrationSlabId may come from body (JSON) OR query OR form-data after multer parses
      let registrationSlabId = req.body?.registrationSlabId || req.query?.registrationSlabId;

      if (!registrationSlabId) {
        return next();
      }

      const slab = await RegistrationSlab.findById(registrationSlabId);
      if (!slab || !slab.additionalFields) return next();

      const uploadFields = slab.additionalFields
        .filter((f) => f.type === "upload")
        .map((f) => ({
          name: `file_${f.id}`,
          maxCount: 1
        }));

      if (uploadFields.length === 0) return next();

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

      const upload = multer({ storage }).fields(uploadFields);

      upload(req, res, function (err) {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({ message: "File upload error", error: err.message });
        }
        next();
      });

    } catch (error) {
      console.error("Dynamic upload middleware error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
