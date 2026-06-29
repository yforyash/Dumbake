const express = require('express');
const cors = require('cors');
const { query } = require('./config/db');
const { seedBakeryItems } = require('./config/seed');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '');
  }
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '');
  }
  if (!req.url.startsWith('/api') && !req.url.startsWith('/api-docs') && req.url !== '/' && req.url !== '') {
    req.url = '/api' + req.url;
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

async function initDatabase() {
  try {
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        wallet_balance NUMERIC(10, 2) DEFAULT 1000.00, -- Seeded with default balance for easy demo ordering!
        is_verified BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(10),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
    } catch (e) {
      console.warn('[DB Init] ALTER TABLE users column checks bypassed (mock mode or other database):', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        item_id INTEGER REFERENCES bakery_items(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS item_id INTEGER REFERENCES bakery_items(id) ON DELETE SET NULL;`);
    } catch (e) {
      console.log('[DB Init] reviews column item_id alteration status:', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bulk_enquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        event_date DATE NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(50) NOT NULL,
        address_line VARCHAR(255) NOT NULL,
        latitude NUMERIC(10, 6),
        longitude NUMERIC(10, 6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6);`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_latitude NUMERIC(10, 6);`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_longitude NUMERIC(10, 6);`);
    } catch (e) {
      console.log('Orders table check status:', e.message);
    }

    await seedBakeryItems();

    await query(`
      INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified)
      VALUES 
        ('Ishika (Owner)', 'admin@dumbake.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 5000.00, TRUE)
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name, 
        password_hash = EXCLUDED.password_hash, 
        role = EXCLUDED.role,
        is_verified = EXCLUDED.is_verified;
    `);
    console.log('[DB] Core database seeding completed successfully.');

  } catch (error) {
    console.error('[DB Error] Failed to initialize database schemas:', error.message);
  }
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dumbake API Backend' });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

initDatabase();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] Dumbake running on port ${PORT}`);
  });
}

module.exports = app;
