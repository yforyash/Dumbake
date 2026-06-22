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
    { id: 1, name: 'Dumbake Signature Fudgy Brookies', description: 'A heavenly, soft-baked fusion of a chocolate chip cookie and a rich fudgy brownie. Dumbake\'s original crowd-pleaser!', price: 150.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: true, stock_quantity: 20, status: 'available' },
    { id: 2, name: 'Nutella Sea Salt Brookies', description: 'Our signature gooey brookies swirled with pure Nutella and topped with flaky Maldon sea salt.', price: 180.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: true, stock_quantity: 15, status: 'available' },
    { id: 3, name: 'Lotus Biscoff Brookies', description: 'Gooey cookie-brownie hybrid bar topped generously with smooth Lotus Biscoff cookie spread.', price: 190.00, category: 'Brookies', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: false, stock_quantity: 12, status: 'available' },
    { id: 4, name: 'Classic Chocolate Fudge Brownies', description: 'Rich, intense dark chocolate brownies with a perfectly glossy, paper-thin crinkle crust.', price: 120.00, category: 'Brownies', image_url: '/dumbake_brownies.png', is_eggless: true, is_bestseller: true, stock_quantity: 25, status: 'available' },
    { id: 5, name: 'Walnut Fudge Brownies', description: 'Ultra-fudgy chocolate brownie loaded with roasted premium walnut pieces.', price: 140.00, category: 'Brownies', image_url: '/dumbake_brownies.png', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 6, name: 'Overloaded Biscoff Brownies', description: 'Decadent dark chocolate brownie slab filled with melted cookie butter swirls.', price: 160.00, category: 'Brownies', image_url: '/dumbake_brownies.png', is_eggless: true, is_bestseller: false, stock_quantity: 10, status: 'available' },
    { id: 7, name: 'Ishika\'s Handcrafted Mango Cake (Seasonal)', description: 'Light sponge cake layered with fresh local Ranchi mango pulp and dairy-whipped cream.', price: 850.00, category: 'Cakes', image_url: '/dumbake_mango_cake.png', is_eggless: true, is_bestseller: true, stock_quantity: 10, status: 'available' },
    { id: 8, name: 'Dumbake Rose Celebration Cake', description: 'Elegant double-layered custom cake decorated with pretty pink rose icing and filled with milk chocolate ganache.', price: 750.00, category: 'Cakes', image_url: '/dumbake_bento_cake.png', is_eggless: true, is_bestseller: true, stock_quantity: 8, status: 'available' },
    { id: 9, name: 'Belgian Truffle Dream Cake', description: 'Decadent five-layer chocolate cake layered with smooth dark Belgian chocolate ganache.', price: 800.00, category: 'Cakes', image_url: '/dumbake_mango_cake.png', is_eggless: true, is_bestseller: false, stock_quantity: 5, status: 'available' },
    { id: 10, name: 'Minimalist Pastel Bento Cake', description: 'Cute 250g lunchbox cake in pastel pink with personalized text, perfect for mini celebrations.', price: 350.00, category: 'Cakes', image_url: '/dumbake_bento_cake.png', is_eggless: true, is_bestseller: false, stock_quantity: 12, status: 'available' },
    { id: 11, name: 'Dumbake Red Velvet Cupcakes', description: 'Vibrant red velvet sponge topped with a rich, velvety vanilla cream cheese frosting swirl.', price: 90.00, category: 'Cupcakes', image_url: '/dumbake_cupcakes.png', is_eggless: true, is_bestseller: true, stock_quantity: 18, status: 'available' },
    { id: 12, name: 'Nutella Dream Cupcakes', description: 'Rich chocolate cupcakes filled with liquid Nutella and decorated with chocolate buttercream.', price: 100.00, category: 'Cupcakes', image_url: '/dumbake_cupcakes.png', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 13, name: 'Lotus Biscoff Cupcakes', description: 'Vanilla cupcake with a biscoff cookie butter core and whipped cookie butter cream.', price: 110.00, category: 'Cupcakes', image_url: '/dumbake_cupcakes.png', is_eggless: true, is_bestseller: false, stock_quantity: 15, status: 'available' },
    { id: 14, name: 'Chunky Chocolate Chip Cookie Box', description: 'Box of 4 thick, bakery-style cookies packed with dark chocolate chunks and baked golden.', price: 300.00, category: 'Pastries & Cookies', image_url: '/dumbake_savories.png', is_eggless: true, is_bestseller: true, stock_quantity: 15, status: 'available' },
    { id: 15, name: 'Lotus Biscoff Cheesecake Pastry', description: 'Silky smooth baked cheesecake slice topped with Lotus Biscoff cookie spread.', price: 180.00, category: 'Pastries & Cookies', image_url: '/dumbake_savories.png', is_eggless: true, is_bestseller: false, stock_quantity: 12, status: 'available' },
    { id: 16, name: 'Nutella Hazelnut Pastry Slice', description: 'Moist chocolate sponge slice layered with premium Nutella hazelnut cream.', price: 160.00, category: 'Pastries & Cookies', image_url: '/dumbake_savories.png', is_eggless: true, is_bestseller: false, stock_quantity: 20, status: 'available' },
    { id: 17, name: 'Dumbake Signature Hamper Box', description: 'A gorgeous pink gifting box containing 2 signature brookies, 2 brownies, and 2 cupcakes.', price: 699.00, category: 'Gift Boxes', image_url: '/dumbake_cupcakes.png', is_eggless: true, is_bestseller: true, stock_quantity: 10, status: 'available' },
    { id: 18, name: 'Assorted Gourmet Cookie Box', description: 'Elegant white box loaded with choco-chip, double chocolate, and red velvet premium cookies.', price: 499.00, category: 'Gift Boxes', image_url: '/dumbake_brookies.png', is_eggless: true, is_bestseller: false, stock_quantity: 8, status: 'available' }
  ],
  orders: [],
  reviews: [
    { id: 1, reviewer_name: 'Ananya K.', rating: 5, comment: 'The butter croissant was absolutely flakey and delicious! Feels like Paris.', created_at: new Date() },
    { id: 2, reviewer_name: 'Rohan M.', rating: 4, comment: 'Truffle cake is decadent, highly recommend it.', created_at: new Date() }
  ],
  resets: [],
  subscribers: [],
  bulk_enquiries: []
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

  // 6b. SELECT * FROM bulk_enquiries
  if (norm.includes('select * from bulk_enquiries')) {
    return { rows: [...mockState.bulk_enquiries].reverse() };
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

  // 8. INSERT INTO subscribers
  if (norm.includes('insert into subscribers')) {
    const [email] = params;
    const newSub = {
      id: mockState.subscribers.length + 1,
      email,
      created_at: new Date()
    };
    mockState.subscribers.push(newSub);
    return { rows: [newSub] };
  }

  // 9. INSERT INTO bulk_enquiries
  if (norm.includes('insert into bulk_enquiries')) {
    const [name, email, phone, eventDate, quantity, notes] = params;
    const newEnq = {
      id: mockState.bulk_enquiries.length + 1,
      name,
      email,
      phone,
      event_date: eventDate,
      quantity,
      notes,
      created_at: new Date()
    };
    mockState.bulk_enquiries.push(newEnq);
    return { rows: [newEnq] };
  }

  // Fallback default response
  return { rows: [] };
}

module.exports = { pool, query };
