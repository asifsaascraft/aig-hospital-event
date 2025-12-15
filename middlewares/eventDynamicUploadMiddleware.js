// middlewares/eventDynamicUploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import DynamicRegForm from "../models/DynamicRegForm.js";

export const dynamicEventUpload = () => {
  return async (req, res, next) => {
    try {
      // ==========================
      // STEP 1: Parse text fields ONLY
      // ==========================
      await new Promise((resolve, reject) => {
        multer({ storage: multer.memoryStorage() }).any()(
          req,
          res,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const eventId = req.params.eventId;
      const registrationSlabId =
        req.body.registrationSlabId || req.query.registrationSlabId;

      let uploadFields = [];

      // ==========================
      // STEP 2: Slab Upload Fields
      // ==========================
      if (registrationSlabId) {
        const slab = await RegistrationSlab.findById(registrationSlabId);

        if (slab?.needAdditionalInfo && slab.additionalFields.length > 0) {
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

      // ==========================
      // STEP 3: Dynamic Form Upload Fields
      // ==========================
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
      // STEP 4: No files → continue
      // ==========================
      if (uploadFields.length === 0) {
        return next();
      }

      // ==========================
      // STEP 5: Upload to S3
      // ==========================
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

      multer({ storage })
        .fields(uploadFields)(req, res, next);
    } catch (error) {
      console.error("Dynamic Upload Error:", error);
      res.status(500).json({ message: "Dynamic file upload failed" });
    }
  };
};
