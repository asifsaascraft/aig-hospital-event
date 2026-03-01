// middlewares/uploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; //  10 MB

export const createUploader = (folder, fileFilter = null) => {
  const storage = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentDisposition: "inline",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `${folder}/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  });

  const uploaderOptions = {
    storage,
    limits: { fileSize: MAX_FILE_SIZE }, //  File size limit
  };

  if (fileFilter) uploaderOptions.fileFilter = fileFilter;

  return multer(uploaderOptions);
};



//  Allow only PDFs
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};


//  Custom file filter for Event (Image + PDF)
const eventFileFilter = (req, file, cb) => {
  if (file.fieldname === "brochureUpload") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Brochure must be a PDF file."), false);
    }
  } else if (file.fieldname === "eventImage") {
    cb(null, true); // allow image
  } else {
    cb(new Error("Invalid file field."), false);
  }
};


//  Event uploader (Image + Brochure)
export const uploadEventFiles = createUploader(
  "events",
  eventFileFilter
);


// Other uploaders
export const uploadVenueImage = createUploader("venues");
export const uploadHotelImage = createUploader("hotels");
export const uploadProfileImage = createUploader("profile-pictures");
export const uploadSponsorImage = createUploader("sponsors");

export const uploadBoothPDF = createUploader("booths", pdfFileFilter);
export const uploadAbstractPDF = createUploader("abstract-files", pdfFileFilter);