const { query } = require('./db');

const initialItems = [
  {
    name: 'Nutella Hazelnut Celebration Cake',
    description: 'Rich hazelnut paste whipped with premium milk chocolate ganache and layered with Nutella crème.',
    price: 850.00,
    category: 'Cakes',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 10
  },
  {
    name: 'Belgian Chocolate Truffle Cake',
    description: 'Rich chocolate sponge layered with smooth dark Belgian chocolate ganache.',
    price: 750.00,
    category: 'Cakes',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 8
  },
  {
    name: 'Strawberry Cream Cake (Seasonal)',
    description: 'Light sponge cake layered with fresh mountain strawberries and dairy-whipped cream.',
    price: 950.00,
    category: 'Cakes',
    image_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 5
  },
  {
    name: 'Lotus Biscoff Cheesecake Pastry',
    description: 'Baked cheesecake slice swirled with Lotus Biscoff spread and topped with biscuit crumbs.',
    price: 180.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 12
  },
  {
    name: 'Nutella Hazelnut Pastry',
    description: 'Fluffy chocolate sponge layer slice filled with Nutella glaze and roasted hazelnuts.',
    price: 160.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Lemon Tart',
    description: 'Crisp pastry shell filled with tangy, silky sweet lemon curd.',
    price: 140.00,
    category: 'Pastries',
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 10
  },
  {
    name: 'Classic Butter Croissant',
    description: 'Flaky, buttery, golden-brown crescent French pastry baked fresh daily.',
    price: 120.00,
    category: 'Breads & Croissants',
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
    is_eggless: false,
    is_bestseller: true,
    stock_quantity: 25
  },
  {
    name: 'Almond Croissant',
    description: 'Double-baked croissant filled with sweet almond frangipane and topped with shaved almonds.',
    price: 160.00,
    category: 'Breads & Croissants',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Pain Au Chocolat',
    description: 'Traditional French puff pastry with a melting core of dark chocolate bars.',
    price: 140.00,
    category: 'Breads & Croissants',
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80',
    is_eggless: false,
    is_bestseller: false,
    stock_quantity: 20
  },
  {
    name: 'Multigrain Sourdough Loaf',
    description: 'Slow-fermented artisan sourdough bread with a crispy crust and a chewy, airy interior.',
    price: 180.00,
    category: 'Breads & Croissants',
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 12
  },
  {
    name: 'Mediterranean Garden Focaccia',
    description: 'Fluffy focaccia bread topped with olives, cherry tomatoes, rosemary, and olive oil.',
    price: 150.00,
    category: 'Breads & Croissants',
    image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 10
  },
  {
    name: 'Bombay Chutney Sandwich',
    description: 'Spiced potato mash layered with mint chutney inside freshly sliced sourdough.',
    price: 140.00,
    category: 'Savory Danishes',
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Chicken Seekh Danish',
    description: 'Flaky savory pastry roll stuffed with spiced chicken seekh kebab chunks.',
    price: 160.00,
    category: 'Savory Danishes',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&q=80',
    is_eggless: false,
    is_bestseller: true,
    stock_quantity: 18
  },
  {
    name: 'Smoky Paneer & Corn Sandwich',
    description: 'Creamy tandoori-spiced cottage cheese and sweet corn kernels baked in soft bread layers.',
    price: 150.00,
    category: 'Savory Danishes',
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 12
  },
  {
    name: 'Luxury Bonbons Box of 18',
    description: 'Exquisite assorted box of hand-painted luxury dark and milk chocolate bonbons.',
    price: 950.00,
    category: 'Chocolates',
    image_url: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 10
  },
  {
    name: 'Assorted Cookie Box Red',
    description: 'Red gift box containing premium double-choco, cranberry oatmeal, and butter cashew cookies.',
    price: 450.00,
    category: 'Gift Boxes',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Bestseller Pastry Box of 6',
    description: 'Box containing two Lotus Biscoff, two Nutella Hazelnut, and two Truffle slice pastries.',
    price: 750.00,
    category: 'Gift Boxes',
    image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 10
  },
  {
    name: 'Caramel Nougat Luxe Box',
    description: 'Luxury gift box loaded with salted caramel bites, honey nougats, and praline slabs.',
    price: 650.00,
    category: 'Gift Boxes',
    image_url: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=500&q=80',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 8
  }
];

async function seedBakeryItems() {
  try {
    for (const item of initialItems) {
      await query(`
        INSERT INTO bakery_items (name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description,
            price = EXCLUDED.price,
            category = EXCLUDED.category,
            image_url = EXCLUDED.image_url,
            is_eggless = EXCLUDED.is_eggless,
            is_bestseller = EXCLUDED.is_bestseller,
            stock_quantity = EXCLUDED.stock_quantity;
      `, [item.name, item.description, item.price, item.category, item.image_url, item.is_eggless, item.is_bestseller, item.stock_quantity]);
    }
    console.log('[DB] Seeding of bakery items completed.');
  } catch (error) {
    console.error('[DB Error] Failed to seed bakery items:', error.message);
  }
}

module.exports = { seedBakeryItems };
