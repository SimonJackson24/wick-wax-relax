const { initializeDb, run } = require('./config/database');

async function seedProducts() {
  try {
    await initializeDb();

    const products = [
      {
        id: '1',
        name: 'Lavender Candle',
        description: 'A calming lavender scented candle.',
        scent_profile: 'Floral',
        base_price: 15.99,
      },
      {
        id: '2',
        name: 'Vanilla Bean Wax Melt',
        description: 'A warm and inviting vanilla bean wax melt.',
        scent_profile: 'Sweet',
        base_price: 5.99,
      },
      {
        id: '3',
        name: 'Eucalyptus Mint Bath Bomb',
        description: 'An invigorating eucalyptus and mint bath bomb.',
        scent_profile: 'Fresh',
        base_price: 7.99,
      },
    ];

    for (const product of products) {
      await run(
        'INSERT INTO products (id, name, description, scent_profile, base_price) VALUES (?, ?, ?, ?, ?)',
        [product.id, product.name, product.description, product.scent_profile, product.base_price]
      );
    }

    console.log('Products seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();