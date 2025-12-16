// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import DynamicRegForm from "../models/DynamicRegForm.js";

export const dynamicEventUpload = () => {
  return async (req, res, next) => {
    try {
      const eventId = req.params.eventId;
      const registrationSlabId =
        req.body?.registrationSlabId || req.query?.registrationSlabId;

      let uploadFields = [];

      // --------------------------
      // Slab upload fields
      // --------------------------
      if (registrationSlabId) {
        const slab = await RegistrationSlab.findById(registrationSlabId);

        if (slab?.needAdditionalInfo && slab.additionalFields?.length > 0) {
          slab.additionalFields
            .filter((f) => f.type === "upload")
            .forEach((f) => {
              uploadFields.push({
                name: `file_${f.id}`,
                maxCount: 1,
              });
            });
        }
      }

      // --------------------------
      // Dynamic Form upload fields
      // --------------------------
      const dynamicForm = await DynamicRegForm.findOne({ eventId });

      if (dynamicForm?.fields?.length > 0) {
        dynamicForm.fields
          .filter((f) => f.type === "file")
          .forEach((f) => {
            uploadFields.push({
              name: `file_dyn_${f.id}`,
              maxCount: 1,
            });
          });
      }

      // ==========================
      //  DEDUPLICATE FIELD NAMES
      // ==========================
      uploadFields = Array.from(
        new Map(uploadFields.map((f) => [f.name, f])).values()
      );
      
      // --------------------------
      // No file fields → skip multer
      // --------------------------
      if (uploadFields.length === 0) {
        return next();
      }

      // --------------------------
      // Multer S3
      // --------------------------
      const storage = multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        contentDisposition: "inline",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          cb(
            null,
            `event-registration/${req.user._id}/${Date.now()}-${file.originalname}`
          );
        },
      });

      return multer({ storage }).fields(uploadFields)(req, res, next);

    } catch (error) {
      console.error("Dynamic Upload Error:", error);
      return res.status(500).json({ message: "Dynamic file upload failed" });
    }
  };
};
