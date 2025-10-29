// middlewares/uploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";

export const createUploader = (folder, fileFilter = null) => {
  const storage = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,

    //  Make file accessible by URL
    acl: "public-read",

    //  Allow browser to open file inline
    contentDisposition: "inline",

    //  Automatically detect file type (PDF, image, etc.)
    contentType: multerS3.AUTO_CONTENT_TYPE,
    
    //  Unique file name pattern
    key: (req, file, cb) => {
      const fileName = `${folder}/${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
  });

  const uploaderOptions = { storage };
  if (fileFilter) uploaderOptions.fileFilter = fileFilter;

  return multer(uploaderOptions);
};

//  Allow only PDFs
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed for booth uploads"), false);
  }
};

//  Export uploaders for different folders
export const uploadVenueImage = createUploader("venues");
export const uploadEventImage = createUploader("events");
export const uploadHotelImage = createUploader("hotels");
export const uploadProfileImage = createUploader("profile-pictures");
export const uploadSponsorImage = createUploader("sponsors");

//  Booth PDF uploader with inline viewing enabled
export const uploadBoothPDF = createUploader("sponsor-booths", pdfFileFilter);



