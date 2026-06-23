const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (allowedImageTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const spreadsheetMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain"
]);

// Allow .xlsx, .xls, and .csv files
const spreadsheetExtensions = new Set([".xlsx", ".xls", ".csv"]);

const spreadsheetFileFilter = (req, file, cb) => {
  const original = (file.originalname || "").toLowerCase();
  const extension = original.slice(original.lastIndexOf("."));

  if (spreadsheetExtensions.has(extension) && spreadsheetMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only .xlsx, .xls, and .csv uploads are allowed"), false);
};

const spreadsheetUpload = multer({
  storage,
  fileFilter: spreadsheetFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = upload;
module.exports.spreadsheetUpload = spreadsheetUpload;
