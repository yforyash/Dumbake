const { Pool } = require('pg');
require('dotenv').config();

let pool;
let isMock = false;

try {
  pool = process.env.DATABASE_URL
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

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err);
    isMock = true;
  });
} else {
  isMock = true;
}

// A robust mock data state for when Postgres is not running or credentials are wrong
const mockState = {
  users: [
    { id: 1, name: 'Dumbake Admin', email: 'admin@dumbake.com', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', wallet_balance: 5000.00 },
    { id: 2, name: 'Bakery Owner', email: 'owner@dumbake.com', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'bakery_owner', wallet_balance: 2500.00 },
    { id: 3, name: 'Yash Customer', email: 'customer@dumbake.com', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'user', wallet_balance: 1000.00 }
  ],
  bakery_items: [
    { id: 1, name: 'Nutella Hazelnut Celebration Cake', description: 'Rich hazelnut paste whipped with premium milk chocolate ganache and layered with Nutella crème.', price: 850.00, category: 'Cakes', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 10, status: 'available' },
    { id: 2, name: 'Belgian Chocolate Truffle Cake', description: 'Rich chocolate sponge layered with smooth dark Belgian chocolate ganache.', price: 750.00, category: 'Cakes', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 8, status: 'available' },
    { id: 3, name: 'Strawberry Cream Cake (Seasonal)', description: 'Light sponge cake layered with fresh mountain strawberries and dairy-whipped cream.', price: 950.00, category: 'Cakes', image_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80', is_eggless: false, is_bestseller: false, stock_quantity: 5, status: 'available' },
    { id: 4, name: 'Lotus Biscoff Cheesecake Pastry', description: 'Baked cheesecake slice swirled with Lotus Biscoff spread and topped with biscuit crumbs.', price: 180.00, category: 'Pastries', image_url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 12, status: 'available' },
    { id: 5, name: 'Nutella Hazelnut Pastry', description: 'Fluffy chocolate sponge layer slice filled with Nutella glaze and roasted hazelnuts.', price: 160.00, category: 'Pastries', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 6, name: 'Lemon Tart', description: 'Crisp pastry shell filled with tangy, silky sweet lemon curd.', price: 140.00, category: 'Pastries', image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&q=80', is_eggless: false, is_bestseller: false, stock_quantity: 10, status: 'available' },
    { id: 7, name: 'Classic Butter Croissant', description: 'Flaky, buttery, golden-brown crescent French pastry baked fresh daily.', price: 120.00, category: 'Breads & Croissants', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80', is_eggless: false, is_bestseller: true, stock_quantity: 25, status: 'available' },
    { id: 8, name: 'Almond Croissant', description: 'Double-baked croissant filled with sweet almond frangipane and topped with shaved almonds.', price: 160.00, category: 'Breads & Croissants', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', is_eggless: false, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 9, name: 'Pain Au Chocolat', description: 'Traditional French puff pastry with a melting core of dark chocolate bars.', price: 140.00, category: 'Breads & Croissants', image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80', is_eggless: false, is_bestseller: false, stock_quantity: 20, status: 'available' },
    { id: 10, name: 'Multigrain Sourdough Loaf', description: 'Slow-fermented artisan sourdough bread with a crispy crust and a chewy, airy interior.', price: 180.00, category: 'Breads & Croissants', image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 12, status: 'available' },
    { id: 11, name: 'Mediterranean Garden Focaccia', description: 'Fluffy focaccia bread topped with olives, cherry tomatoes, rosemary, and olive oil.', price: 150.00, category: 'Breads & Croissants', image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 10, status: 'available' },
    { id: 12, name: 'Bombay Chutney Sandwich', description: 'Spiced potato mash layered with mint chutney inside freshly sliced sourdough.', price: 140.00, category: 'Savory Danishes', image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 13, name: 'Chicken Seekh Danish', description: 'Flaky savory pastry roll stuffed with spiced chicken seekh kebab chunks.', price: 160.00, category: 'Savory Danishes', image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&q=80', is_eggless: false, is_bestseller: true, stock_quantity: 18, status: 'available' },
    { id: 14, name: 'Smoky Paneer & Corn Sandwich', description: 'Creamy tandoori-spiced cottage cheese and sweet corn kernels baked in soft bread layers.', price: 150.00, category: 'Savory Danishes', image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 12, status: 'available' },
    { id: 15, name: 'Luxury Bonbons Box of 18', description: 'Exquisite assorted box of hand-painted luxury dark and milk chocolate bonbons.', price: 950.00, category: 'Chocolates', image_url: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 10, status: 'available' },
    { id: 16, name: 'Assorted Cookie Box Red', description: 'Red gift box containing premium double-choco, cranberry oatmeal, and butter cashew cookies.', price: 450.00, category: 'Gift Boxes', image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 17, name: 'Bestseller Pastry Box of 6', description: 'Box containing two Lotus Biscoff, two Nutella Hazelnut, and two Truffle slice pastries.', price: 750.00, category: 'Gift Boxes', image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80', is_eggless: true, is_bestseller: true, stock_quantity: 10, status: 'available' },
    { id: 18, name: 'Caramel Nougat Luxe Box', description: 'Luxury gift box loaded with salted caramel bites, honey nougats, and praline slabs.', price: 650.00, category: 'Gift Boxes', image_url: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=500&q=80', is_eggless: true, is_bestseller: false, stock_quantity: 8, status: 'available' }
  ],
  orders: [],
  reviews: [
    { id: 1, reviewer_name: 'Ananya K.', rating: 5, comment: 'The butter croissant was absolutely flakey and delicious! Feels like Paris.', created_at: new Date() },
    { id: 2, reviewer_name: 'Rohan M.', rating: 4, comment: 'Truffle cake is decadent, highly recommend it.', created_at: new Date() }
  ],
  resets: []
};

async function query(text, params) {
  if (isMock || !pool) {
    return runMockQuery(text, params);
  }
  
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn('[DB Query failed] Falling back to mock state.', err.message);
    isMock = true; // latch to mock
    return runMockQuery(text, params);
  }
}

function runMockQuery(text, params) {
  const norm = text.toLowerCase().trim();
  
  // 1. SELECT * FROM bakery_items
  if (norm.includes('select * from bakery_items') || norm.includes('select * from items')) {
    let list = [...mockState.bakery_items];
    if (norm.includes('category =')) {
      const cat = params[0];
      list = list.filter(i => i.category === cat);
    }
    return { rows: list };
  }
  
  // 2. SELECT id, name, email, role, wallet_balance FROM users
  if (norm.includes('select') && norm.includes('users') && norm.includes('email =')) {
    const email = params[0];
    const user = mockState.users.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  
  if (norm.includes('select') && norm.includes('users') && norm.includes('id =')) {
    const id = params[0];
    const user = mockState.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // 3. INSERT INTO users
  if (norm.includes('insert into users')) {
    const [name, email, passwordHash, role] = params;
    const newUser = {
      id: mockState.users.length + 1,
      name,
      email,
      password_hash: passwordHash,
      role: role || 'user',
      wallet_balance: 1000.00
    };
    mockState.users.push(newUser);
    return { rows: [newUser] };
  }

  // 4. INSERT INTO orders
  if (norm.includes('insert into orders')) {
    const [userId, items, totalPrice, deliveryType, address, paymentMethod, paymentStatus, customerName, customerPhone] = params;
    const newOrder = {
      id: mockState.orders.length + 1,
      user_id: userId,
      items: typeof items === 'string' ? JSON.parse(items) : items,
      total_price: totalPrice,
      status: 'Placed',
      delivery_type: deliveryType,
      address,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      customer_name: customerName,
      customer_phone: customerPhone,
      created_at: new Date()
    };
    mockState.orders.push(newOrder);
    return { rows: [newOrder] };
  }

  // 5. SELECT * FROM orders
  if (norm.includes('select * from orders')) {
    return { rows: [...mockState.orders].reverse() };
  }

  // 6. SELECT * FROM reviews
  if (norm.includes('select * from reviews')) {
    return { rows: [...mockState.reviews].reverse() };
  }

  // 7. INSERT INTO reviews
  if (norm.includes('insert into reviews')) {
    const [userId, reviewerName, rating, comment] = params;
    const newReview = {
      id: mockState.reviews.length + 1,
      user_id: userId,
      reviewer_name: reviewerName,
      rating,
      comment,
      created_at: new Date()
    };
    mockState.reviews.push(newReview);
    return { rows: [newReview] };
  }

  // Fallback default response
  return { rows: [] };
}

module.exports = { pool, query };
