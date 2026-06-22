const { query } = require('./db');

const initialItems = [
  {
    name: 'Classic Butter Croissant',
    description: 'Flaky, buttery, golden-brown crescent-shaped French pastry baked fresh daily.',
    price: 120.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
    is_eggless: false,
    is_bestseller: true,
    stock_quantity: 25
  },
  {
    name: 'Belgian Chocolate Truffle Cake',
    description: 'Rich chocolate sponge layered with smooth dark Belgian chocolate ganache.',
    price: 650.00,
    category: 'Cakes',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 8
  },
  {
    name: 'French Macaron Box (6 pcs)',
    description: 'Assorted box of raspberry, chocolate, pistachio, lemon, salted caramel, and vanilla macarons.',
    price: 350.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Artisan Sourdough Loaf',
    description: 'Slow-fermented sourdough bread with a crispy crust and a chewy, airy interior.',
    price: 180.00,
    category: 'Breads',
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 12
  },
  {
    name: 'Classic Red Velvet Pastry',
    description: 'Vibrant crimson sponge layer cake filled with vanilla bean cream cheese frosting.',
    price: 140.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 18
  },
  {
    name: 'Fudgy Walnut Brownie',
    description: 'Decadent, dense chocolate brownie packed with crunch roasted walnuts.',
    price: 90.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 20
  },
  {
    name: 'Freshly Baked French Baguette',
    description: 'Traditional long French bread, crispy on the outside, soft and fluffy inside.',
    price: 90.00,
    category: 'Breads',
    image_url: 'https://images.unsplash.com/photo-1597089542047-b9873d82d8ec?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 10
  },
  {
    name: 'Spiced Paneer Puff',
    description: 'Crispy flaky puff pastry filled with spiced cottage cheese and peppers.',
    price: 60.00,
    category: 'Savories',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 30
  },
  {
    name: 'Strawberry Cream Shortcake',
    description: 'Light sponge cake layered with fresh mountain strawberries and whipped cream.',
    price: 700.00,
    category: 'Cakes',
    image_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 6
  },
  {
    name: 'Gourmet Chocolate Chip Cookie',
    description: 'Crisp edges, chewy center, loaded with premium milk and dark chocolate chunks.',
    price: 70.00,
    category: 'Cookies',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 40
  }
];

async function seedBakeryItems() {
  try {
    for (const item of initialItems) {
      await query(`
        INSERT INTO bakery_items (name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO NOTHING;
      `, [item.name, item.description, item.price, item.category, item.image_url, item.is_eggless, item.is_bestseller, item.stock_quantity]);
    }
    console.log('[DB] Seeding of bakery items completed.');
  } catch (error) {
    console.error('[DB Error] Failed to seed bakery items:', error.message);
  }
}

module.exports = { seedBakeryItems };
