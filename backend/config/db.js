// config/db.js
// Dual-mode database controller for DumBake.
// Attempts real PostgreSQL connection (via DATABASE_URL or individual env vars).
// Gracefully falls back to a JSON-based query simulator in sandbox mode to prevent startup crashes.

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let isMock = false;

const hasUrl = !!process.env.DATABASE_URL;
const hasParams = !!(process.env.DB_HOST && process.env.DB_DATABASE);

if (hasUrl || hasParams) {
  try {
    pool = hasUrl
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('neon') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false
        })
      : new Pool({
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_DATABASE || 'Dumbake',
          password: process.env.DB_PASSWORD || 'postgres',
          port: parseInt(process.env.DB_PORT || '5432'),
        });
  } catch (e) {
    console.warn('[DB Connect] Initial connection failed, running in sandbox mock mode.', e.message);
    isMock = true;
  }
} else {
  console.warn('[DB Connect] No database credentials found. Running in sandbox mock mode.');
  isMock = true;
}

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err.message);
    isMock = true;
  });
}

// -------------------------------------------------------------------------
// SANDBOX MOCK QUERY PROCESSOR
// -------------------------------------------------------------------------
const mockState = {
  users: [
    { id: 1, name: 'Ishika (Owner)', email: 'admin@dumbake.com', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', wallet_balance: 5000.00, is_verified: true, verification_code: null, phone: '9151463571' }
  ],
  bakery_items: [
    { id: 1, name: 'Dumbake Signature Fudgy Brookies', description: 'A heavenly, soft-baked fusion of a chocolate chip cookie and a rich fudgy brownie.', price: 150.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: true, stock_quantity: 20, status: 'available' },
    { id: 2, name: 'Nutella Sea Salt Brookies', description: 'Our signature gooey brookies swirled with pure Nutella and topped with sea salt.', price: 180.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: true, stock_quantity: 15, status: 'available' },
    { id: 3, name: 'Lotus Biscoff Brookies', description: 'Gooey cookie-brownie hybrid bar topped generously with smooth Lotus Biscoff cookie spread.', price: 190.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: false, stock_quantity: 12, status: 'available' },
    { id: 4, name: 'Classic Chocolate Fudge Brownies', description: 'Rich, intense dark chocolate brownies with a perfectly glossy, paper-thin crinkle crust.', price: 120.00, category: 'Brownies', image_url: '/dumbake_brownies.png', is_eggless: true, is_bestseller: true, stock_quantity: 25, status: 'available' }
  ],
  orders: [],
  reviews: [],
  resets: [],
  subscribers: [],
  bulk_enquiries: [],
  user_addresses: [],
  rider_locations: []
};

const MOCK_STATE_FILE = path.join(__dirname, 'mock_db_state.json');

function saveMockState() {
  try {
    fs.writeFileSync(MOCK_STATE_FILE, JSON.stringify(mockState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Mock DB] Failed to save mock state:', err.message);
  }
}

function loadMockState() {
  try {
    if (fs.existsSync(MOCK_STATE_FILE)) {
      const data = fs.readFileSync(MOCK_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      Object.assign(mockState, parsed);
      console.log('[Mock DB] Successfully loaded persisted mock state.');
    } else {
      saveMockState();
    }
  } catch (err) {
    console.warn('[Mock DB] Failed to load mock state, using defaults:', err.message);
  }
}

loadMockState();

async function query(text, params = []) {
  if (isMock || !pool) {
    return runMockQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn('[DB Query failed] Falling back to mock state.', err.message);
    isMock = true;
    return runMockQuery(text, params);
  }
}

function runMockQuery(text, params = []) {
  const norm = text.toLowerCase().trim();

  // SELECT USERS
  if (norm.includes('from users') && norm.includes('email =')) {
    const email = params[0];
    const user = mockState.users.find(u => u.email && email && typeof u.email === 'string' && typeof email === 'string' && u.email.toLowerCase() === email.toLowerCase());
    return { rows: user ? [user] : [] };
  }
  if (norm.includes('from users') && norm.includes('id =')) {
    const id = parseInt(params[0]);
    const user = mockState.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // INSERT USER
  if (norm.includes('insert into users')) {
    const [name, email, password_hash, role, verification_code, phone] = params;
    const newUser = {
      id: mockState.users.length + 1,
      name,
      email,
      password_hash,
      role,
      wallet_balance: 1000.00,
      is_verified: false,
      verification_code: verification_code || null,
      phone
    };
    mockState.users.push(newUser);
    saveMockState();
    return { rows: [newUser] };
  }

  // UPDATE USER VERIFICATION
  if (norm.includes('update users') && norm.includes('is_verified =')) {
    const id = params[params.length - 1];
    const user = mockState.users.find(u => u.id === parseInt(id));
    if (user) {
      user.is_verified = true;
      user.verification_code = null;
      saveMockState();
    }
    return { rows: user ? [user] : [] };
  }

  // UPDATE USER WALLET DEDUCTION
  if (norm.includes('update users') && norm.includes('wallet_balance =')) {
    const amount = parseFloat(params[0]);
    const id = parseInt(params[1]);
    const user = mockState.users.find(u => u.id === id);
    if (user) {
      user.wallet_balance = Math.max(0, parseFloat(user.wallet_balance) - amount);
      saveMockState();
    }
    return { rows: user ? [user] : [] };
  }

  // SELECT BAKERY ITEMS
  if (norm.includes('from bakery_items')) {
    if (norm.includes('id =')) {
      const id = parseInt(params[0]);
      const item = mockState.bakery_items.find(i => i.id === id);
      return { rows: item ? [item] : [] };
    }
    return { rows: mockState.bakery_items };
  }

  // UPDATE BAKERY ITEMS STOCK
  if (norm.includes('update bakery_items')) {
    if (norm.includes('stock_quantity =')) {
      const quantity = parseInt(params[0]);
      const id = parseInt(params[1]);
      const item = mockState.bakery_items.find(i => i.id === id);
      if (item) {
        item.stock_quantity = Math.max(0, item.stock_quantity - quantity);
        if (item.stock_quantity === 0) item.status = 'out_of_stock';
        saveMockState();
      }
      return { rows: item ? [item] : [] };
    }
  }

  // INSERT REVIEW
  if (norm.includes('insert into reviews')) {
    const [userId, reviewerName, rating, comment, itemId] = params;
    const newReview = {
      id: mockState.reviews.length + 1,
      user_id: userId,
      reviewer_name: reviewerName,
      rating,
      comment,
      item_id: itemId ? parseInt(itemId) : null,
      created_at: new Date()
    };
    mockState.reviews.push(newReview);
    saveMockState();
    return { rows: [newReview] };
  }

  // SELECT REVIEWS
  if (norm.includes('from reviews')) {
    return { rows: mockState.reviews };
  }

  // INSERT SUBSCRIBER
  if (norm.includes('insert into subscribers')) {
    const [email] = params;
    const newSub = { id: mockState.subscribers.length + 1, email, created_at: new Date() };
    mockState.subscribers.push(newSub);
    saveMockState();
    return { rows: [newSub] };
  }

  // SELECT PASSWORD RESETS
  if (norm.includes('from password_resets')) {
    const email = params[0];
    const token = params[1];
    const found = mockState.resets.find(r => r.email && email && typeof r.email === 'string' && typeof email === 'string' && r.email.toLowerCase() === email.toLowerCase() && r.token === token);
    return { rows: found ? [found] : [] };
  }

  // INSERT PASSWORD RESET
  if (norm.includes('insert into password_resets')) {
    const [email, token, expiresAt] = params;
    const newReset = { email, token, expires_at: expiresAt };
    mockState.resets.push(newReset);
    saveMockState();
    return { rows: [newReset] };
  }

  // DELETE PASSWORD RESET
  if (norm.includes('delete from password_resets')) {
    const email = params[0];
    mockState.resets = mockState.resets.filter(r => !(r.email && email && typeof r.email === 'string' && typeof email === 'string' && r.email.toLowerCase() === email.toLowerCase()));
    saveMockState();
    return { rows: [] };
  }

  // UPDATE USER PASSWORD
  if (norm.includes('update users') && norm.includes('password_hash =')) {
    const passwordHash = params[0];
    const email = params[1];
    const user = mockState.users.find(u => u.email && email && typeof u.email === 'string' && typeof email === 'string' && u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.password_hash = passwordHash;
      saveMockState();
    }
    return { rows: user ? [user] : [] };
  }

  // INSERT INTO ORDERS
  if (norm.includes('insert into orders')) {
    const [userId, items, totalPrice, deliveryType, address, paymentMethod, paymentStatus, customerName, customerPhone, latitude, longitude] = params;
    const newOrder = {
      id: mockState.orders.length + 1,
      user_id: parseInt(userId),
      items: typeof items === 'string' ? JSON.parse(items) : items,
      total_price: parseFloat(totalPrice),
      status: 'Placed',
      delivery_type: deliveryType,
      address,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      customer_name: customerName,
      customer_phone: customerPhone,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      created_at: new Date()
    };
    mockState.orders.push(newOrder);
    saveMockState();
    return { rows: [newOrder] };
  }

  // SELECT ORDERS
  if (norm.includes('from orders')) {
    if (norm.includes('count(')) {
      const userId = params[0];
      const count = mockState.orders.filter(o => o.user_id === parseInt(userId)).length;
      return { rows: [{ count }] };
    }
    let list = [...mockState.orders];
    if (norm.includes('user_id =')) {
      const uId = parseInt(params[0]);
      list = list.filter(o => o.user_id === uId);
    }
    return { rows: list.reverse() };
  }

  // UPDATE ORDERS
  if (norm.includes('update orders')) {
    const orderId = parseInt(params[params.length - 1]);
    const order = mockState.orders.find(o => o.id === orderId);
    if (order) {
      if (norm.includes('status =')) {
        order.status = params[0] || order.status;
      }
      if (norm.includes('payment_status =')) {
        order.payment_status = norm.includes('status =') ? (params[1] || order.payment_status) : (params[0] || order.payment_status);
      }
      saveMockState();
    }
    return { rows: order ? [order] : [] };
  }

  // SELECT ADDRESSES
  if (norm.includes('from user_addresses')) {
    const userId = params[0];
    const addresses = mockState.user_addresses.filter(a => a.user_id === parseInt(userId));
    return { rows: addresses };
  }

  // INSERT ADDRESS
  if (norm.includes('insert into user_addresses')) {
    const [userId, label, addressLine, latitude, longitude] = params;
    if (!mockState.user_addresses) mockState.user_addresses = [];
    const newAddr = {
      id: mockState.user_addresses.length + 1,
      user_id: parseInt(userId),
      label,
      address_line: addressLine,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      created_at: new Date()
    };
    mockState.user_addresses.push(newAddr);
    saveMockState();
    return { rows: [newAddr] };
  }

  // DELETE ADDRESS
  if (norm.includes('delete from user_addresses')) {
    const id = parseInt(params[0]);
    if (mockState.user_addresses) {
      mockState.user_addresses = mockState.user_addresses.filter(a => a.id !== id);
      saveMockState();
    }
    return { rows: [] };
  }

  // --- COMPLAINTS SYSTEM MOCK QUERIES ---
  if (!mockState.complaints) mockState.complaints = [];
  if (!mockState.complaint_messages) mockState.complaint_messages = [];
  if (!mockState.uploaded_files) mockState.uploaded_files = [];

  // INSERT INTO UPLOADED_FILES
  if (norm.includes('insert into uploaded_files')) {
    const [userId, filename, mimeType, size, data] = params;
    const newFile = {
      id: mockState.uploaded_files.length + 1,
      user_id: parseInt(userId),
      filename,
      mime_type: mimeType,
      size: parseInt(size),
      data,
      created_at: new Date()
    };
    mockState.uploaded_files.push(newFile);
    saveMockState();
    return { rows: [newFile] };
  }

  // SELECT FROM UPLOADED_FILES
  if (norm.includes('from uploaded_files')) {
    const id = parseInt(params[0]);
    const file = mockState.uploaded_files.find(f => f.id === id);
    return { rows: file ? [file] : [] };
  }

  // INSERT INTO COMPLAINTS
  if (norm.includes('insert into complaints')) {
    const [orderId, userId, subject, description] = params;
    const newComplaint = {
      id: mockState.complaints.length + 1,
      order_id: parseInt(orderId),
      user_id: parseInt(userId),
      subject,
      description,
      status: 'Open',
      created_at: new Date()
    };
    mockState.complaints.push(newComplaint);
    saveMockState();
    return { rows: [newComplaint] };
  }

  // SELECT FROM COMPLAINTS
  if (norm.includes('from complaints')) {
    if (norm.includes('c.user_id =') || norm.includes('user_id =')) {
      const uId = parseInt(params[0]);
      const list = mockState.complaints.filter(c => c.user_id === uId);
      return { rows: list };
    }
    if (norm.includes('c.id =') || norm.includes('c.id =')) {
      const cId = parseInt(params[0]);
      const complaint = mockState.complaints.find(c => c.id === cId);
      if (complaint) {
        const user = mockState.users.find(u => u.id === complaint.user_id);
        const order = mockState.orders.find(o => o.id === complaint.order_id);
        return { rows: [{ ...complaint, customer_name: user?.name, customer_email: user?.email, order_date: order?.created_at }] };
      }
      return { rows: [] };
    }
    if (norm.includes('where id =') || norm.includes('where c.id =')) {
      const id = parseInt(params[0]);
      const complaint = mockState.complaints.find(c => c.id === id);
      return { rows: complaint ? [complaint] : [] };
    }
    // all complaints
    const list = mockState.complaints.map(c => {
      const user = mockState.users.find(u => u.id === c.user_id);
      const order = mockState.orders.find(o => o.id === c.order_id);
      return {
        ...c,
        customer_name: user?.name || 'Customer',
        customer_email: user?.email || 'customer@example.com',
        order_date: order?.created_at || new Date()
      };
    });
    return { rows: list };
  }

  // INSERT INTO COMPLAINT_MESSAGES
  if (norm.includes('insert into complaint_messages')) {
    const [complaintId, senderId, message, fileId] = params;
    const newMsg = {
      id: mockState.complaint_messages.length + 1,
      complaint_id: parseInt(complaintId),
      sender_id: parseInt(senderId),
      message: message || null,
      file_id: fileId ? parseInt(fileId) : null,
      created_at: new Date()
    };
    mockState.complaint_messages.push(newMsg);
    saveMockState();
    return { rows: [newMsg] };
  }

  // SELECT FROM COMPLAINT_MESSAGES
  if (norm.includes('from complaint_messages')) {
    const cId = parseInt(params[0]);
    const list = mockState.complaint_messages.filter(m => m.complaint_id === cId).map(m => {
      const user = mockState.users.find(u => u.id === m.sender_id);
      const file = mockState.uploaded_files.find(f => f.id === m.file_id);
      return {
        ...m,
        sender_name: user?.name || 'User',
        sender_role: user?.role || 'user',
        file_name: file?.filename || null,
        file_type: file?.mime_type || null,
        file_size: file?.size || null
      };
    });
    return { rows: list };
  }

  // UPDATE COMPLAINTS STATUS
  if (norm.includes('update complaints') && norm.includes('status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    const complaint = mockState.complaints.find(c => c.id === id);
    if (complaint) {
      complaint.status = status;
      saveMockState();
    }
    return { rows: complaint ? [complaint] : [] };
  }

  return { rows: [] };
}

module.exports = {
  query,
  pool,
  getIsMock: () => isMock
};
