// config/fileLimits.js
// File upload size limits and allowed MIME types for DumBake

module.exports = {
  // Max sizes in bytes
  limits: {
    pptx: 20 * 1024 * 1024, // 20 MB
    pdf: 10 * 1024 * 1024,  // 10 MB (raised from 5 MB)
    image: 5 * 1024 * 1024, // 5 MB (raised from 3 MB)
    text: 2 * 1024 * 1024,  // 2 MB (raised from 1 MB)
    video: 50 * 1024 * 1024, // 50 MB
  },
  // Allowed MIME types per category
  mimeTypes: {
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    pdf: ['application/pdf'],
    image: ['image/jpeg', 'image/png'],
    text: ['text/plain'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  },
};
