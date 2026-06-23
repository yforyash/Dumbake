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
    { id: 1, name: 'Ishika (Owner)', email: 'admin@dumbake.com', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', wallet_balance: 5000.00, is_verified: true, verification_code: null }
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
    { id: 1, reviewer_name: 'Ananya K.', rating: 5, comment: 'Dumbake Signature Fudgy Brookies are out of this world! Pure chocolate bliss.', item_id: 1, created_at: new Date('2026-06-21T10:00:00Z') },
    { id: 2, reviewer_name: 'Rohan M.', rating: 4, comment: 'Belgian Truffle Dream Cake is decadent, highly recommend it.', item_id: 9, created_at: new Date('2026-06-22T11:00:00Z') },
    { id: 3, reviewer_name: 'Shreya S.', rating: 5, comment: 'Nutella Sea Salt Brookies have the perfect balance of sweet and salty.', item_id: 2, created_at: new Date('2026-06-22T14:30:00Z') },
    { id: 4, reviewer_name: 'Aditya P.', rating: 3, comment: 'Classic Chocolate Fudge Brownies were a bit too sweet for me, but texture was great.', item_id: 4, created_at: new Date('2026-06-23T08:00:00Z') },
    { id: 5, reviewer_name: 'Neha R.', rating: 5, comment: 'Dumbake Signature Fudgy Brookies are the best thing I have ever tasted! Extremely rich and fudgy!', item_id: 1, created_at: new Date('2026-06-23T09:15:00Z') },
    { id: 6, reviewer_name: 'Riddhi K.', rating: 5, comment: 'Awesome bakery! Love the ambiance and packaging.', item_id: null, created_at: new Date('2026-06-23T09:30:00Z') }
  ],
  resets: [],
  subscribers: [],
  bulk_enquiries: [],
  user_addresses: []
};

const fs = require('fs');
const path = require('path');
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
      console.log('[Mock DB] Successfully loaded persisted mock state from disk.');
    } else {
      saveMockState();
    }
  } catch (err) {
    console.warn('[Mock DB] Failed to load mock state, using defaults:', err.message);
  }
}

loadMockState();

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

function runMockQuery(text, params = []) {
  const norm = text.toLowerCase().trim();
  
  // 1. SELECT ... FROM bakery_items
  if ((norm.includes('from bakery_items') || norm.includes('from items')) && !norm.includes('delete')) {
    let list = [...mockState.bakery_items];
    if (norm.includes('category =')) {
      const cat = params[0];
      list = list.filter(i => i.category === cat);
    }
    if (norm.includes('where id =')) {
      const id = parseInt(params[0]);
      list = list.filter(i => i.id === id);
    }
    if (norm.includes('where name =')) {
      const name = params[0];
      list = list.filter(i => i.name.toLowerCase() === name.toLowerCase());
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
    let name, email, passwordHash, role, code, phone;
    
    if (params && params.length === 6) {
      name = params[0];
      email = params[1];
      passwordHash = params[2];
      role = params[3];
      code = params[4];
      phone = params[5];
    } else if (params && params.length === 5) {
      name = params[0];
      email = params[1];
      passwordHash = params[2];
      role = params[3];
      code = params[4];
      phone = null;
    } else if (norm.includes('verification_code')) {
      name = params && params[0] ? params[0] : 'Ishika (Owner)';
      email = params && params[1] ? params[1] : 'admin@dumbake.com';
      passwordHash = params && params[2] ? params[2] : '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      code = params && params[3] ? params[3] : null;
      role = 'user';
      phone = null;
    } else if (params && params.length === 3) {
      name = params[0];
      email = params[1];
      passwordHash = params[2];
      role = 'user';
      code = null;
      phone = null;
    } else if (params && params.length === 2) {
      name = params[0];
      email = params[1];
      passwordHash = 'mock_hash';
      role = 'user';
      code = null;
      phone = null;
    } else {
      name = params && params[0] ? params[0] : 'Ishika (Owner)';
      email = params && params[1] ? params[1] : 'admin@dumbake.com';
      passwordHash = params && params[2] ? params[2] : '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      role = (params && params[3]) || 'admin';
      code = null;
      phone = null;
    }

    const existingIdx = mockState.users.findIndex(u => u.email === email);
    const newUser = {
      id: existingIdx >= 0 ? mockState.users[existingIdx].id : mockState.users.length + 1,
      name,
      email,
      password_hash: passwordHash,
      role: role,
      wallet_balance: existingIdx >= 0 ? mockState.users[existingIdx].wallet_balance : 1000.00,
      is_verified: existingIdx >= 0 ? mockState.users[existingIdx].is_verified : false,
      verification_code: code,
      phone: phone || (existingIdx >= 0 ? mockState.users[existingIdx].phone : null)
    };

    if (existingIdx >= 0) {
      mockState.users[existingIdx] = newUser;
    } else {
      mockState.users.push(newUser);
    }
    saveMockState();
    const publicUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      wallet_balance: newUser.wallet_balance,
      is_verified: newUser.is_verified,
      phone: newUser.phone
    };
    return { rows: [publicUser] };
  }

  // 3b. UPDATE users
  if (norm.includes('update users')) {
    let user;
    if (norm.includes('where email =')) {
      const email = params[params.length - 1];
      user = mockState.users.find(u => u.email === email);
    } else if (norm.includes('where id =')) {
      const id = parseInt(params[params.length - 1]);
      user = mockState.users.find(u => u.id === id);
    }
    
    if (user) {
      if (norm.includes('is_verified = true') || norm.includes('is_verified = $')) {
        user.is_verified = true;
      }
      if (norm.includes('is_verified = false')) {
        user.is_verified = false;
      }
      if (norm.includes('verification_code =')) {
        if (norm.includes('set name =') && norm.includes('password_hash =')) {
          user.name = params[0];
          user.password_hash = params[1];
          user.verification_code = params[2];
          if (norm.includes('role =')) {
            user.role = params[3];
          }
          if (norm.includes('phone =')) {
            user.phone = params[4] || null;
          }
        } else {
          user.verification_code = params[0];
        }
      }
      if (norm.includes('password_hash =') && !norm.includes('set name =')) {
        user.password_hash = params[0];
      }
      if (norm.includes('wallet_balance = wallet_balance -')) {
        user.wallet_balance = parseFloat((user.wallet_balance - parseFloat(params[0])).toFixed(2));
      }
    }
    saveMockState();
    const publicUser = user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      is_verified: user.is_verified
    } : null;
    return { rows: publicUser ? [publicUser] : [] };
  }

  // 3b. INSERT INTO bakery_items
  if (norm.includes('insert into bakery_items')) {
    const [name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity] = params;
    const newItem = {
      id: mockState.bakery_items.length + 1,
      name,
      description,
      price: parseFloat(price),
      category,
      image_url,
      is_eggless: !!is_eggless,
      is_bestseller: !!is_bestseller,
      stock_quantity: parseInt(stock_quantity || 10),
      status: 'available'
    };
    mockState.bakery_items.push(newItem);
    saveMockState();
    return { rows: [newItem] };
  }

  // 3c. UPDATE bakery_items
  if (norm.includes('update bakery_items')) {
    if (norm.includes('stock_quantity = stock_quantity -')) {
      // Stock decrement query: params = [quantity, id]
      const quantity = parseInt(params[0]);
      const id = parseInt(params[1]);
      const item = mockState.bakery_items.find(i => i.id === id);
      if (item) {
        item.stock_quantity = Math.max(0, item.stock_quantity - quantity);
        if (item.stock_quantity === 0) {
          item.status = 'out_of_stock';
        }
        saveMockState();
      }
      return { rows: item ? [item] : [] };
    } else {
      // Admin update query: params = [name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity, status, id]
      const id = parseInt(params[params.length - 1]);
      const item = mockState.bakery_items.find(i => i.id === id);
      if (item) {
        const [name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity, status] = params;
        if (name !== null && name !== undefined) item.name = name;
        if (description !== null && description !== undefined) item.description = description;
        if (price !== null && price !== undefined) item.price = parseFloat(price);
        if (category !== null && category !== undefined) item.category = category;
        if (image_url !== null && image_url !== undefined) item.image_url = image_url;
        if (is_eggless !== null && is_eggless !== undefined) item.is_eggless = is_eggless;
        if (is_bestseller !== null && is_bestseller !== undefined) item.is_bestseller = is_bestseller;
        if (stock_quantity !== null && stock_quantity !== undefined) {
          item.stock_quantity = parseInt(stock_quantity);
          if (item.stock_quantity > 0 && item.status === 'out_of_stock') {
            item.status = 'available';
          }
        }
        if (status !== null && status !== undefined) item.status = status;
        saveMockState();
      }
      return { rows: item ? [item] : [] };
    }
  }

  // 3d. DELETE FROM bakery_items
  if (norm.includes('delete from bakery_items')) {
    const id = params[0];
    mockState.bakery_items = mockState.bakery_items.filter(i => i.id !== parseInt(id));
    saveMockState();
    return { rows: [] };
  }

  // 4. INSERT INTO orders
  if (norm.includes('insert into orders')) {
    const [userId, items, totalPrice, deliveryType, address, paymentMethod, paymentStatus, customerName, customerPhone, latitude, longitude] = params;
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
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      created_at: new Date()
    };
    mockState.orders.push(newOrder);
    saveMockState();
    return { rows: [newOrder] };
  }

  // 5. SELECT * FROM orders
  if (norm.includes('select * from orders')) {
    if (norm.includes('count(*)')) {
      let list = [...mockState.orders];
      if (norm.includes('user_id =')) {
        const uId = parseInt(params[0]);
        list = list.filter(o => o.user_id === uId);
      }
      return { rows: [{ count: list.length }] };
    }
    return { rows: [...mockState.orders].reverse() };
  }

  // 6. SELECT * FROM reviews
  if (norm.includes('select * from reviews') || norm.includes('from reviews')) {
    const reviewsWithItemName = mockState.reviews.map(r => {
      const matchedItem = mockState.bakery_items.find(i => i.id === r.item_id);
      return {
        ...r,
        item_name: matchedItem ? matchedItem.name : null
      };
    });
    return { rows: [...reviewsWithItemName].reverse() };
  }

  // 6b. SELECT * FROM bulk_enquiries
  if (norm.includes('select * from bulk_enquiries')) {
    return { rows: [...mockState.bulk_enquiries].reverse() };
  }

  // 7. INSERT INTO reviews
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

  // 8. INSERT INTO subscribers
  if (norm.includes('insert into subscribers')) {
    const [email] = params;
    const newSub = {
      id: mockState.subscribers.length + 1,
      email,
      created_at: new Date()
    };
    mockState.subscribers.push(newSub);
    saveMockState();
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
    saveMockState();
    return { rows: [newEnq] };
  }

  // 10. SELECT * FROM user_addresses
  if (norm.includes('from user_addresses') && !norm.includes('insert') && !norm.includes('update') && !norm.includes('delete')) {
    const userId = params[0];
    let list = mockState.user_addresses || [];
    if (userId) {
      list = list.filter(a => a.user_id === parseInt(userId));
    }
    return { rows: list };
  }

  // 11. INSERT INTO user_addresses
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

  // 12. DELETE FROM user_addresses
  if (norm.includes('delete from user_addresses')) {
    const id = parseInt(params[0]);
    if (mockState.user_addresses) {
      mockState.user_addresses = mockState.user_addresses.filter(a => a.id !== id);
      saveMockState();
    }
    return { rows: [] };
  }

  // 13. UPDATE orders
  if (norm.includes('update orders')) {
    if (norm.includes('rider_latitude') || norm.includes('rider_longitude')) {
      const riderLat = params[0] ? parseFloat(params[0]) : null;
      const riderLng = params[1] ? parseFloat(params[1]) : null;
      const orderId = parseInt(params[2]);
      const order = mockState.orders.find(o => o.id === orderId);
      if (order) {
        order.rider_latitude = riderLat;
        order.rider_longitude = riderLng;
        saveMockState();
      }
      return { rows: order ? [order] : [] };
    } else {
      const orderId = parseInt(params[params.length - 1]);
      const order = mockState.orders.find(o => o.id === orderId);
      if (order) {
        if (norm.includes('status = coalesce') || norm.includes('status = $1')) {
          order.status = params[0] || order.status;
        }
        if (norm.includes('payment_status =')) {
          order.payment_status = norm.includes('status =') ? (params[1] || order.payment_status) : (params[0] || order.payment_status);
        }
        saveMockState();
      }
      return { rows: order ? [order] : [] };
    }
  }

  // Fallback default response
  return { rows: [] };
}

module.exports = { pool, query };
