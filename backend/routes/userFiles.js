// routes/userFiles.js
// Endpoints for secure file uploads, AI triage, and generated file downloads

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');
const { createUploader, getFileConfig } = require('../middleware/sizeValidator');
const { parsePDF, parsePPTX, parseImage } = require('../services/fileParser');
const aiService = require('../services/aiService');
const fileGenerator = require('../services/fileGenerator');
const db = require('../config/db');
const logger = require('../utils/logger');

// Helper to store file metadata (simple example)
async function storeFileMeta(userId, originalName, mime, size, buffer) {
  const result = await db.query(
    `INSERT INTO uploaded_files (user_id, filename, mime_type, size, data) 
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [userId, originalName, mime, size, buffer]
  );
  return result.rows[0].id;
}

/**
 * POST /upload
 * Accept a single file, validate size/type, parse, run AI triage, and store original file.
 */
router.post('/upload', verifyToken, (req, res, next) => {
  const uploader = createUploader();
  uploader(req, res, async err => {
    if (err) {
      if (err instanceof require('multer').MulterError) {
        // Multer provides code like LIMIT_FILE_SIZE etc.
        return res.status(413).json({ error: err.message });
      }
      return next(err);
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { originalname, mimetype, size, buffer } = req.file;
    // Store original file metadata & data
    try {
      const fileId = await storeFileMeta(req.user.id, originalname, mimetype, size, buffer);
      // Parse based on extension
      const ext = originalname.split('.').pop().toLowerCase();
      let parsedContent;
      if (ext === 'pdf') parsedContent = await parsePDF(buffer);
      else if (ext === 'pptx') parsedContent = parsePPTX(buffer);
      else if (['jpg', 'jpeg', 'png'].includes(ext)) parsedContent = parseImage(buffer);
      else return res.status(415).json({ error: 'Unsupported file type for AI triage' });

      // Run AI triage service (expects Buffer or text)
      const triageResult = await aiService.triageTicket(parsedContent, ext);

      // Respond with triage data and stored file ID for later download
      res.json({ fileId, triageResult });
    } catch (e) {
      next(e);
    }
  });
});

/**
 * GET /download-admin-file/:fileId
 * Returns the stored file as an attachment (admin only)
 */
router.get('/download-admin-file/:fileId', verifyToken, async (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  const fileId = req.params.fileId;
  try {
    const result = await db.query('SELECT filename, mime_type, data FROM uploaded_files WHERE id = $1', [fileId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'File not found' });
    const { filename, mime_type, data } = result.rows[0];
    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
