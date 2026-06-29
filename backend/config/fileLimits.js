// config/fileLimits.js
// File upload size limits and allowed MIME types for DumBake

module.exports = {
  // Max sizes in bytes
  limits: {
    pptx: 20 * 1024 * 1024, // 20 MB
    pdf: 5 * 1024 * 1024,   // 5 MB
    image: 3 * 1024 * 1024, // 3 MB
    text: 1 * 1024 * 1024,  // 1 MB
  },
  // Allowed MIME types per category
  mimeTypes: {
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    pdf: ['application/pdf'],
    image: ['image/jpeg', 'image/png'],
    text: ['text/plain'],
  },
};
