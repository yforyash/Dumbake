// services/aiService.js
// Wrapper around OpenAI GPT‑4o Vision API for ticket triage

const { Configuration, OpenAIApi } = require('openai');
const logger = require('../utils/logger');

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey) {
  const configuration = new Configuration({ apiKey });
  openai = new OpenAIApi(configuration);
} else {
  logger.warn('⚠️ OPENAI_API_KEY environment variable is missing. AI Triage functions will return simulated results.');
}

/**
 * Send parsed content to OpenAI Vision (or text) model and expect a JSON response
 * @param {string|Buffer} content Parsed content – text for PDF/PPTX, Buffer for images
 * @param {string} ext File extension to help prompt (pdf|pptx|jpg|png)
 * @returns {Promise<Object>} { category, confidence, summary }
 */
async function triageTicket(content, ext) {
  if (!openai) {
    logger.info('Simulating AI Triage response (sandbox mode)');
    return {
      category: 'FOOD_ISSUE',
      confidence: 0.92,
      summary: 'Simulated support ticket triage: order items mismatch report in sandbox environment.'
    };
  }

  try {
    // Build messages depending on type
    const messages = [];
    if (Buffer.isBuffer(content)) {
      // Image – send as multipart base64
      const base64 = content.toString('base64');
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `You are an AI support triage assistant. Analyse the attached image and output JSON with fields: category (BILL_ISSUE or FOOD_ISSUE), confidence (0‑1 float), summary (short description).` },
          { type: 'image_url', image_url: { url: `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${base64}` } },
        ],
      });
    } else {
      // Text content (PDF or PPTX extracted text)
      messages.push({
        role: 'user',
        content: `You are an AI support triage assistant. Based on the following extracted text, output JSON with fields: category (BILL_ISSUE or FOOD_ISSUE), confidence (0‑1 float), summary (short description).\n\n---\n${content}\n---`,
      });
    }
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0,
      messages,
      max_tokens: 300,
    });
    const raw = response.data.choices[0].message.content.trim();
    // Attempt to parse JSON strictly
    const json = JSON.parse(raw);
    // Validate required keys
    if (!json.category || typeof json.confidence !== 'number' || !json.summary) {
      throw new Error('Invalid AI response format');
    }
    return json;
  } catch (err) {
    logger.error('AI triage failed', err);
    throw err;
  }
}

module.exports = {
  triageTicket,
};
