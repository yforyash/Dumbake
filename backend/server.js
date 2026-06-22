const express = require('express');
const cors = require('cors');
const { query } = require('./config/db');
const { seedBakeryItems } = require('./config/seed');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Request logger middleware (simple implementation)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

async function initDatabase() {
  try {
    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        wallet_balance NUMERIC(10, 2) DEFAULT 1000.00, -- Seeded with default balance for easy demo ordering!
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Password Resets Table
    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Bakery Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS bakery_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image_url TEXT,
        is_eggless BOOLEAN DEFAULT TRUE,
        is_bestseller BOOLEAN DEFAULT FALSE,
        stock_quantity INTEGER DEFAULT 10,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Orders Table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        items JSONB NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Placed', -- Placed, Preparing, Ready, Delivered, Cancelled
        delivery_type VARCHAR(20) DEFAULT 'Delivery', -- Delivery, Pickup
        address VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'COD', -- COD, UPI, Card
        payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Paid, Failed
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Reviews Table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed bakery items
    await seedBakeryItems();

    // Seed default roles/test accounts with password hash of 'admin123'
    await query(`
      INSERT INTO users (name, email, password_hash, role, wallet_balance)
      VALUES 
        ('Dumbake Admin', 'admin@dumbake.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 5000.00),
        ('Bakery Owner', 'owner@dumbake.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'bakery_owner', 2500.00),
        ('Yash Customer', 'customer@dumbake.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', 1000.00)
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name, 
        password_hash = EXCLUDED.password_hash, 
        role = EXCLUDED.role;
    `);
    console.log('[DB] Core database seeding completed successfully.');

  } catch (error) {
    console.error('[DB Error] Failed to initialize database schemas:', error.message);
  }
}

// Routes registration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai', require('./routes/ai'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dumbake API Backend' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, async () => {
  console.log(`[Server] Dumbake running on port ${PORT}`);
  await initDatabase();
});
