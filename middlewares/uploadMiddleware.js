// middlewares/uploadMiddleware.js
import path from 'path'
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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Event Image must be an image file."), false);
    }
  } else {
    cb(new Error("Invalid file field."), false);
  }
};

// Message Images Filter
const messageImageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

// Committee Member Image Filter
const committeeMemberImageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

// Speaker Image Filter
const speakerImageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

//  Event uploader (Image + Brochure)
export const uploadEventFiles = createUploader(
  "events",
  eventFileFilter
);


// Other uploaders
// Message Images Upload
export const uploadMessageImages = createUploader(
  "messages",
  messageImageFilter
);
export const uploadCommitteeMemberImage = createUploader(
  "committee-members",
  committeeMemberImageFilter
);
export const uploadSpeakerImage = createUploader(
  "speakers",
  speakerImageFilter
);
export const uploadDownloadFile = createUploader(
  "downloads"
);
export const uploadVenueImage = createUploader("venues");
export const uploadHotelImage = createUploader("hotels");
export const uploadProfileImage = createUploader("profile-pictures");
export const uploadSponsorImage = createUploader("sponsors");

export const uploadAbstractPDF = createUploader("abstract-files", pdfFileFilter);

// Govenoment Id for Travel booked Upload (PDF only, 2MB)
export const uploadIdForTravel = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentDisposition: "inline",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `governoment-ids/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, //  2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});


// Sponsor Booth Upload (PDF only, 2MB)
export const uploadBoothPDF = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentDisposition: "inline",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `booths/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});



// Allow Excel / CSV files
// Allow Excel / CSV files
const excelFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // XLSX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // XLS
    'application/vnd.ms-excel',

    // CSV
    'text/csv',
    'application/csv',
    'text/plain',
  ]

  const allowedExtensions = [
    '.xlsx',
    '.xls',
    '.csv',
  ]

  const ext = path
    .extname(file.originalname)
    .toLowerCase()

  if (
    allowedMimeTypes.includes(
      file.mimetype,
    ) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Only Excel (.xlsx, .xls) and CSV files are allowed.',
      ),
      false,
    )
  }
}


// Sponsor Excel Upload
export const uploadSponsorExcel =
  createUploader(
    'sponsor-excel',
    excelFileFilter,
  )



