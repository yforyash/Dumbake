// server.js
// Main entry point for DumBake backend – sets up Express app, middlewares, routes, Socket.io, and DB init.

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Attach io instance to app for route access
app.set('io', io);

const PORT = process.env.PORT || 5001;

// Global middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting – apply a generic limiter globally
const { generalLimiter } = require('./middleware/rateLimiter');
app.use(generalLimiter);

// Path rewriting for Vercel/Netlify compatibility (kept from original)
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// -------------------------------------------------------------------
// Database initialization – create tables and seed data (original logic)
// -------------------------------------------------------------------
async function initDatabase() {
  try {
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        wallet_balance NUMERIC(10, 2) DEFAULT 1000.00,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(10),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Additional columns (safe ALTER IF NOT EXISTS)
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
    } catch (e) {
      console.warn('[DB Init] Column checks bypassed:', e.message);
    }

    // Password resets
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bakery items
    await db.query(`
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

    // Orders
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        items JSONB NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Placed',
        delivery_type VARCHAR(20) DEFAULT 'Delivery',
        address VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'COD',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        latitude NUMERIC(10,6),
        longitude NUMERIC(10,6),
        rider_latitude NUMERIC(10,6),
        rider_longitude NUMERIC(10,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reviews
    await db.query(`
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

    // Subscribers
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bulk enquiries
    await db.query(`
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

    // User addresses
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(50) NOT NULL,
        address_line VARCHAR(255) NOT NULL,
        latitude NUMERIC(10,6),
        longitude NUMERIC(10,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Rider locations (for GPS streaming)
    await db.query(`
      CREATE TABLE IF NOT EXISTS rider_locations (
        rider_id INTEGER PRIMARY KEY,
        lat NUMERIC(10,6) NOT NULL,
        lng NUMERIC(10,6) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Rider assignments (order ↔ rider relationship)
    await db.query(`
      CREATE TABLE IF NOT EXISTS rider_assignments (
        order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
        rider_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Uploaded files (binary storage)
    await db.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Complaints table
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Complaint messages (support chatbox log)
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaint_messages (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        file_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed bakery items (uses helper in config/seed.js)
    const { seedBakeryItems } = require('./config/seed');
    await seedBakeryItems();

    // Create admin user if not exists
    await db.query(`
      INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified)
      VALUES ('Ishika (Owner)', 'admin@dumbake.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 5000.00, TRUE)
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

// -------------------------------------------------------------------
// Socket.io events – kitchen alarm & rider updates are emitted from routes.
// -------------------------------------------------------------------
io.on('connection', socket => {
  console.log('🔗 Socket.io client connected', socket.id);
  socket.on('disconnect', () => console.log('❌ Socket.io client disconnected', socket.id));
});

// -------------------------------------------------------------------
// Register API routes
// -------------------------------------------------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/userfiles', require('./routes/userFiles'));
app.use('/api/complaints', require('./routes/complaints'));

// Health endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Dumake API Backend' }));

// Centralized error handler (must be after routes)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Initialise DB then start server
initDatabase();

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Server] Dumake running on port ${PORT}`);
  });
}

module.exports = app;
