const { query } = require('./db');

const initialItems = [
  {
    name: 'Dumbake Signature Fudgy Brookies',
    description: 'A heavenly, soft-baked fusion of a chocolate chip cookie and a rich fudgy brownie. Dumbake\'s original crowd-pleaser!',
    price: 150.00,
    category: 'Brookies',
    image_url: '/dumbake_brookies.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 20
  },
  {
    name: 'Nutella Sea Salt Brookies',
    description: 'Our signature gooey brookies swirled with pure Nutella and topped with flaky Maldon sea salt.',
    price: 180.00,
    category: 'Brookies',
    image_url: '/dumbake_brookies.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 15
  },
  {
    name: 'Lotus Biscoff Brookies',
    description: 'Gooey cookie-brownie hybrid bar topped generously with smooth Lotus Biscoff cookie spread.',
    price: 190.00,
    category: 'Brookies',
    image_url: '/dumbake_brookies.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 12
  },
  {
    name: 'Classic Chocolate Fudge Brownies',
    description: 'Rich, intense dark chocolate brownies with a perfectly glossy, paper-thin crinkle crust.',
    price: 120.00,
    category: 'Brownies',
    image_url: '/dumbake_brownies.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 25
  },
  {
    name: 'Walnut Fudge Brownies',
    description: 'Ultra-fudgy chocolate brownie loaded with roasted premium walnut pieces.',
    price: 140.00,
    category: 'Brownies',
    image_url: '/dumbake_brownies.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Overloaded Biscoff Brownies',
    description: 'Decadent dark chocolate brownie slab filled with melted cookie butter swirls.',
    price: 160.00,
    category: 'Brownies',
    image_url: '/dumbake_brownies.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 10
  },
  {
    name: 'Ishika\'s Handcrafted Mango Cake (Seasonal)',
    description: 'Light sponge cake layered with fresh local Ranchi mango pulp and dairy-whipped cream.',
    price: 850.00,
    category: 'Cakes',
    image_url: '/dumbake_mango_cake.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 10
  },
  {
    name: 'Dumbake Rose Celebration Cake',
    description: 'Elegant double-layered custom cake decorated with pretty pink rose icing and filled with milk chocolate ganache.',
    price: 750.00,
    category: 'Cakes',
    image_url: '/dumbake_bento_cake.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 8
  },
  {
    name: 'Belgian Truffle Dream Cake',
    description: 'Decadent five-layer chocolate cake layered with smooth dark Belgian chocolate ganache.',
    price: 800.00,
    category: 'Cakes',
    image_url: '/dumbake_mango_cake.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 5
  },
  {
    name: 'Minimalist Pastel Bento Cake',
    description: 'Cute 250g lunchbox cake in pastel pink with personalized text, perfect for mini celebrations.',
    price: 350.00,
    category: 'Cakes',
    image_url: '/dumbake_bento_cake.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 12
  },
  {
    name: 'Dumbake Red Velvet Cupcakes',
    description: 'Vibrant red velvet sponge topped with a rich, velvety vanilla cream cheese frosting swirl.',
    price: 90.00,
    category: 'Cupcakes',
    image_url: '/dumbake_cupcakes.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 18
  },
  {
    name: 'Nutella Dream Cupcakes',
    description: 'Rich chocolate cupcakes filled with liquid Nutella and decorated with chocolate buttercream.',
    price: 100.00,
    category: 'Cupcakes',
    image_url: '/dumbake_cupcakes.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Lotus Biscoff Cupcakes',
    description: 'Vanilla cupcake with a biscoff cookie butter core and whipped cookie butter cream.',
    price: 110.00,
    category: 'Cupcakes',
    image_url: '/dumbake_cupcakes.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 15
  },
  {
    name: 'Chunky Chocolate Chip Cookie Box',
    description: 'Box of 4 thick, bakery-style cookies packed with dark chocolate chunks and baked golden.',
    price: 300.00,
    category: 'Pastries & Cookies',
    image_url: '/dumbake_savories.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 15
  },
  {
    name: 'Lotus Biscoff Cheesecake Pastry',
    description: 'Silky smooth baked cheesecake slice topped with Lotus Biscoff cookie spread.',
    price: 180.00,
    category: 'Pastries & Cookies',
    image_url: '/dumbake_savories.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 12
  },
  {
    name: 'Nutella Hazelnut Pastry Slice',
    description: 'Moist chocolate sponge slice layered with premium Nutella hazelnut cream.',
    price: 160.00,
    category: 'Pastries & Cookies',
    image_url: '/dumbake_savories.png',
    is_eggless: true,
    is_bestseller: false,
    stock_quantity: 20
  },
  {
    name: 'Dumbake Signature Hamper Box',
    description: 'A gorgeous pink gifting box containing 2 signature brookies, 2 brownies, and 2 cupcakes.',
    price: 699.00,
    category: 'Gift Boxes',
    image_url: '/dumbake_cupcakes.png',
    is_eggless: true,
    is_bestseller: true,
    stock_quantity: 10
  },
  {
    name: 'Assorted Gourmet Cookie Box',
    description: 'Elegant white box loaded with choco-chip, double chocolate, and red velvet premium cookies.',
    price: 499.00,
    category: 'Gift Boxes',
    image_url: '/dumbake_brookies.png',
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
