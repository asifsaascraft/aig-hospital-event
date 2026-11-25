// middlewares/importUserUpload.js

import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".csv",
    ".xlsx",
    ".xls",
  ];

  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        "Only CSV, XLS and XLSX files are allowed"
      )
    );
  }

  cb(null, true);
};

export const uploadUserImport = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});