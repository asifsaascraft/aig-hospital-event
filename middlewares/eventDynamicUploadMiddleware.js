// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import DynamicRegForm from "../models/DynamicRegForm.js"; 

export const dynamicEventUpload = () => {
  return async (req, res, next) => {
    try {
      const registrationSlabId = req.query.registrationSlabId;
      const eventId = req.params.eventId;

      // STEP 1: Default memory multer if no dynamic files
      const memoryUpload = multer({ storage: multer.memoryStorage() }).any();

      let uploadFields = [];

      // ============ Fetch Slab Additional Upload Fields ============
      if (registrationSlabId) {
        const slab = await RegistrationSlab.findById(registrationSlabId);

        if (slab?.additionalFields?.length > 0) {
          const slabUploadFields = slab.additionalFields
            .filter((f) => f.type === "upload")
            .map((f) => ({ name: `file_${f.id}`, maxCount: 1 }));

          uploadFields.push(...slabUploadFields);
        }
      }

      // ============ Fetch Dynamic Form Upload Fields ============
      const dynamicForm = await DynamicRegForm.findOne({ eventId });
      if (dynamicForm?.fields?.length > 0) {
        const dynamicUploadFields = dynamicForm.fields
          .filter((f) => f.type === "file")
          .map((f) => ({ name: `file_dyn_${f.id}`, maxCount: 1 }));

        uploadFields.push(...dynamicUploadFields);
      }

      // If NO upload fields → normal memory upload
      if (uploadFields.length === 0) {
        return memoryUpload(req, res, next);
      }

      // ============ AWS S3 STORAGE ============
      const storage = multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        contentDisposition: "inline",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const userId = req.user._id.toString();
          cb(
            null,
            `event-registration/${userId}/${Date.now()}-${file.originalname}`
          );
        },
      });

      return multer({ storage }).fields(uploadFields)(req, res, next);
    } catch (error) {
      console.error("Dynamic Upload Error:", error);
      return res.status(500).json({ message: "File upload middleware failed" });
    }
  };
};
