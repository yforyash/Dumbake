// services/fileParser.js
// Utilities to parse uploaded files (PDF, PPTX, images)

const pdfParse = require('pdf-parse');
const officeParser = require('officeparser'); // works for PPTX

/**
 * Parse PDF buffer and return extracted text
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error('Failed to parse PDF: ' + err.message);
  }
}

/**
 * Parse PPTX buffer and return JSON representation of slides
 */
function parsePPTX(buffer) {
  try {
    // officeparser returns JSON with slide titles & contents
    const result = officeParser.parsePPTX(buffer);
    return result; // array of slide objects
  } catch (err) {
    throw new Error('Failed to parse PPTX: ' + err.message);
  }
}

/**
 * Simple passthrough for image buffers – returns the raw buffer
 */
function parseImage(buffer) {
  return buffer; // caller may forward to AI service directly
}

module.exports = {
  parsePDF,
  parsePPTX,
  parseImage,
};
