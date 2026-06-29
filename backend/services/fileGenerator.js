// services/fileGenerator.js
// Utilities to generate PDFs (via pdfkit) and PPTX (via pptxgenjs) from processed data

const PDFDocument = require('pdfkit');
const PPTXGenJS = require('pptxgenjs');
const logger = require('../utils/logger');

/**
 * Generate a PDF buffer from plain text content
 * @param {string} title Title for the PDF (displayed as heading)
 * @param {string} body Text body (could be extracted from PDF or AI summary)
 * @returns {Promise<Buffer>} PDF file buffer
 */
function generatePDF(title, body) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      // Simple styling – heading + body
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(body, { lineGap: 2 });
      doc.end();
    } catch (err) {
      logger.error('PDF generation error', err);
      reject(err);
    }
  });
}

/**
 * Generate a PPTX buffer from an array of slide objects
 * @param {Array<{title:string, content:string}>} slides
 * @returns {Promise<Buffer>} PPTX file buffer
 */
async function generatePPTX(slides) {
  try {
    const pptx = new PPTXGenJS();
    slides.forEach(slide => {
      const s = pptx.addSlide();
      s.addText(slide.title, { x: 0.5, y: 0.3, fontSize: 24, bold: true });
      s.addText(slide.content, { x: 0.5, y: 1.0, fontSize: 14, lineSpacing: 20 });
    });
    // pptx.save returns a file; we need buffer – use export to base64 then decode
    const base64 = await pptx.output({ base64: true });
    return Buffer.from(base64, 'base64');
  } catch (err) {
    logger.error('PPTX generation error', err);
    throw err;
  }
}

module.exports = {
  generatePDF,
  generatePPTX,
};
