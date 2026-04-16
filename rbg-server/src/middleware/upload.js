// src/middleware/upload.js
const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.memoryStorage();

// File filter to allow PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Optional: limit to 10MB
});

module.exports = upload;
