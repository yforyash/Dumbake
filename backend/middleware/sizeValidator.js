// middleware/sizeValidator.js
// Multer configuration enforcing file size limits and allowed MIME types

const multer = require('multer');
const path = require('path');
const { limits, mimeTypes } = require('../config/fileLimits');

// Helper to select appropriate limits based on file extension
function getFileConfig(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pptx') return { limit: limits.pptx, mime: mimeTypes.pptx };
  if (ext === '.pdf') return { limit: limits.pdf, mime: mimeTypes.pdf };
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return { limit: limits.image, mime: mimeTypes.image };
  if (ext === '.txt') return { limit: limits.text, mime: mimeTypes.text };
  if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) return { limit: limits.video, mime: mimeTypes.video };
  return null; // unsupported type
}

const storage = multer.memoryStorage(); // keep files in memory for further processing

function fileFilter(req, file, cb) {
  const cfg = getFileConfig(file);
  if (!cfg) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type'));
  }
  if (!cfg.mime.includes(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid MIME type'));
  }
  cb(null, true);
}

function createUploader() {
  return multer({
    storage,
    fileFilter,
    limits: {
      // apply generic max file size (largest) – individual size will be checked later
      fileSize: Math.max(limits.pptx, limits.pdf, limits.image, limits.text, limits.video),
    },
  }).single('file');
}

module.exports = {
  createUploader,
  getFileConfig,
};
