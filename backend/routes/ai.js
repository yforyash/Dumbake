const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Get AI Personalized Recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all available items
    const itemsRes = await query('SELECT * FROM bakery_items WHERE status = $1', ['available']);
    const allItems = itemsRes.rows;

    if (allItems.length === 0) {
      return res.json([]);
    }

    // Heuristics: Parse history
    let pastOrders = [];
    if (userId) {
      const ordersRes = await query('SELECT items FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]);
      ordersRes.rows.forEach(order => {
        try {
          const itemsArray = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          pastOrders = pastOrders.concat(itemsArray);
        } catch (e) {
          // ignore parsing error
        }
      });
    }

    // Try Gemini API if key is present
    if (process.env.GEMINI_API_KEY && pastOrders.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
          You are the AI chef of "Dumbake" bakery. Based on the customer's order history, recommend 3 items from our menu.
          
          Customer Past Orders:
          ${JSON.stringify(pastOrders.map(i => ({ name: i.name, quantity: i.quantity })))}
          
          Available Menu Items:
          ${JSON.stringify(allItems.map(i => ({ id: i.id, name: i.name, category: i.category, description: i.description, price: i.price })))}
          
          Return a JSON array of recommendations. Format:
          [
            { "id": <item_id>, "ai_reason": "<short 1-sentence friendly reason why this is recommended based on past orders>" }
          ]
          Do NOT include markdown syntax (like \`\`\`json) or extra text. Return ONLY raw JSON.
        `;

        const responseResult = await model.generateContent(prompt);
        let textResponse = responseResult.response.text().trim();
        
        // Clean up markdown wrapper if model returns it
        if (textResponse.startsWith('```json')) {
          textResponse = textResponse.substring(7, textResponse.length - 3).trim();
        } else if (textResponse.startsWith('```')) {
          textResponse = textResponse.substring(3, textResponse.length - 3).trim();
        }

        const recommendedIds = JSON.parse(textResponse);
        
        // Match IDs with actual database items and append reason
        const finalRecommendations = [];
        for (const rec of recommendedIds) {
          const matchedItem = allItems.find(item => item.id === parseInt(rec.id));
          if (matchedItem) {
            finalRecommendations.push({
              ...matchedItem,
              ai_reason: rec.ai_reason || `Baked fresh to complement your tastes!`
            });
          }
        }

        if (finalRecommendations.length > 0) {
          return res.json(finalRecommendations);
        }
      } catch (geminiError) {
        console.warn('[AI Service] Gemini recommendation failed, falling back to local heuristic:', geminiError.message);
      }
    }

    // Fallback: Local Smart Heuristic recommendation
    // If user has orders: recommend items in their most frequently ordered category that they haven't bought yet
    const categoryCount = {};
    const orderedItemNames = new Set(pastOrders.map(item => item.name));

    pastOrders.forEach(item => {
      // Find category in menu items
      const matched = allItems.find(m => m.name === item.name);
      if (matched) {
        categoryCount[matched.category] = (categoryCount[matched.category] || 0) + 1;
      }
    });

    let favoriteCategory = null;
    let maxCount = 0;
    Object.keys(categoryCount).forEach(cat => {
      if (categoryCount[cat] > maxCount) {
        maxCount = categoryCount[cat];
        favoriteCategory = cat;
      }
    });

    let recs = [];
    if (favoriteCategory) {
      // Filter available items in favorite category that haven't been purchased
      recs = allItems.filter(item => item.category === favoriteCategory && !orderedItemNames.has(item.name));
    }

    // If we don't have enough recommendations, fall back to time-of-day heuristic
    if (recs.length < 3) {
      const currentHour = new Date().getHours();
      let preferredCategory = 'Cakes';
      if (currentHour >= 5 && currentHour < 12) {
        // Morning -> Breads / Pastries
        preferredCategory = Math.random() > 0.5 ? 'Breads' : 'Pastries';
      } else if (currentHour >= 12 && currentHour < 17) {
        // Afternoon -> Savories / Cookies
        preferredCategory = Math.random() > 0.5 ? 'Savories' : 'Cookies';
      } else {
        // Evening/Night -> Cakes / Pastries
        preferredCategory = 'Cakes';
      }

      const extraItems = allItems.filter(item => item.category === preferredCategory && !orderedItemNames.has(item.name));
      recs = recs.concat(extraItems);
    }

    // If still empty, get bestsellers or any items
    if (recs.length === 0) {
      recs = allItems.filter(item => item.is_bestseller).slice(0, 3);
    }
    if (recs.length === 0) {
      recs = allItems.slice(0, 3);
    }

    // Map default reasons
    const finalRecs = recs.slice(0, 3).map(item => {
      let reason = 'Chef recommendation for a delightful treat!';
      if (item.category === 'Breads') reason = 'Freshly baked sourdough to start your day right!';
      if (item.category === 'Pastries') reason = 'Flaky French layers that pair perfectly with morning coffee!';
      if (item.category === 'Cakes') reason = 'Indulgent bestseller, perfect for celebration or self-love!';
      if (item.category === 'Savories') reason = 'Savory pastries to satisfy mid-day cravings!';
      return {
        ...item,
        ai_reason: reason
      };
    });

    res.json(finalRecs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Dynamic AI Bestsellers (based on real-time order statistics)
router.get('/bestsellers', async (req, res) => {
  try {
    // We analyze the orders table to calculate dynamic bestsellers
    const ordersRes = await query('SELECT items FROM orders WHERE status != $1', ['Cancelled']);
    const salesCount = {};

    ordersRes.rows.forEach(order => {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        items.forEach(item => {
          salesCount[item.id] = (salesCount[item.id] || 0) + item.quantity;
        });
      } catch (e) {
        // ignore parsing error
      }
    });

    // Fetch all items
    const itemsRes = await query('SELECT * FROM bakery_items WHERE status = $1', ['available']);
    const allItems = itemsRes.rows;

    // Map sales count to items
    const itemsWithSales = allItems.map(item => {
      return {
        ...item,
        sales_volume: salesCount[item.id] || 0
      };
    });

    // Sort by sales volume (descending) and is_bestseller flag (as a fallback / weight)
    itemsWithSales.sort((a, b) => {
      if (b.sales_volume !== a.sales_volume) {
        return b.sales_volume - a.sales_volume;
      }
      return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
    });

    // Return the top 4 bestsellers
    res.json(itemsWithSales.slice(0, 4));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
