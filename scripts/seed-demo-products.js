/**
 * Seed demo products for Wick Wax Relax
 * Run: node scripts/seed-demo-products.js
 *
 * Inserts 3-4 products per category with realistic scent profiles,
 * variants, images, and inventory. Safe to re-run (clears demo products first).
 */

const { Pool } = require('/home/simon/Projects/wick-wax-relax/backend/node_modules/pg');

// Separate pool for seed script so it can use transactions
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'wick_wax_relax',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const query = (text, params) => pool.query(text, params);

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ===== 1. Clear any existing demo products =====
    await client.query(`
      DELETE FROM product_images
      WHERE product_id IN (
        SELECT id FROM products WHERE name LIKE 'Demo:%'
      )
    `);
    await client.query(`DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Demo:%')`);
    await client.query(`DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Demo:%')`);
    await client.query(`DELETE FROM inventory WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Demo:%')`);
    await client.query(`DELETE FROM products WHERE name LIKE 'Demo:%'`);
    console.log('Cleared existing demo products');

    // ===== 2. Get category IDs =====
    const categories = await client.query(`SELECT id, slug, name FROM categories WHERE parent_id IS NULL ORDER BY display_order`);
    const catMap = {};
    categories.rows.forEach(r => { catMap[r.slug] = r.id; });
    console.log('Categories:', Object.keys(catMap));

    // ===== 3. Get PWA channel ID =====
    const channels = await client.query(`SELECT id, name FROM channels`);
    const channelMap = {};
    channels.rows.forEach(r => { channelMap[r.name] = r.id; });
    console.log('Channels:', Object.keys(channelMap));

    const pwaChannelId = channelMap['PWA'];

    // ===== 4. Demo products by category =====
    const demoProducts = [
      // === WAX MELTS ===
      {
        name: 'Demo: Summer柠檬 Grove',
        description: 'A bright, zesty blend of Sicilian lemon, yuzu, and a hint of cedar. Perfect for energising your space during long summer evenings. Hand-poured soy wax melts designed for electric warmers.',
        scent_profile: { top: ['lemon', 'yuzu', 'bergamot'], heart: ['orange blossom', 'green tea'], base: ['cedar', 'white musk'], intensity: 'medium', mood: 'energising' },
        base_price: 8.99,
        image_url: 'https://images.unsplash.com/photo-1602607688546-62d05c1a7c95?w=800&q=80',
        is_featured: true,
        tags: 'citrus,summer,energising',
        variants: [
          { name: '6 Pack', sku: 'DEMO-WM-LEMON-6', price: 8.99, inventory: 50 },
          { name: '12 Pack', sku: 'DEMO-WM-LEMON-12', price: 16.99, inventory: 30 },
        ]
      },
      {
        name: 'Demo: Midnight Jasmine',
        description: 'Intoxicating night-blooming jasmine with Arabian oud and sandalwood. A luxurious, lingering fragrance that transforms any room into a sanctuary of calm.',
        scent_profile: { top: ['jasmine', 'ylang-ylang'], heart: ['rose', ' tuberose'], base: ['oud', 'sandalwood', 'amber'], intensity: 'strong', mood: 'romantic' },
        base_price: 9.99,
        image_url: 'https://images.unsplash.com/photo-1547887538-047ad8cea3e1?w=800&q=80',
        is_featured: true,
        tags: 'floral,luxury,romantic',
        variants: [
          { name: '6 Pack', sku: 'DEMO-WM-JASMINE-6', price: 9.99, inventory: 40 },
          { name: '12 Pack', sku: 'DEMO-WM-JASMINE-12', price: 18.99, inventory: 25 },
        ]
      },
      {
        name: 'Demo: Fireside Vanilla',
        description: 'Rich Madagascan vanilla pods with smoky tonka bean and a whisper of clove. Warm, comforting, and utterly addictive on cold nights.',
        scent_profile: { top: ['vanilla bean', 'tonka'], heart: ['cinnamon', 'clove'], base: ['amber', 'smoked wood'], intensity: 'strong', mood: 'cozy' },
        base_price: 8.49,
        image_url: 'https://images.unsplash.com/photo-1608181831718-2501deb73d59?w=800&q=80',
        is_featured: false,
        tags: 'vanilla,cozy,warm',
        variants: [
          { name: '6 Pack', sku: 'DEMO-WM-VANILLA-6', price: 8.49, inventory: 60 },
          { name: '12 Pack', sku: 'DEMO-WM-VANILLA-12', price: 15.99, inventory: 35 },
        ]
      },
      {
        name: 'Demo: Eucalyptus & Mint',
        description: 'Cool eucalyptus leaves blended with crisp peppermint and a touch of rosemary. A spa-like clarity that clears the mind and invigorates the senses.',
        scent_profile: { top: ['eucalyptus', 'peppermint'], heart: ['rosemary', 'tea tree'], base: ['cedar', 'pine'], intensity: 'medium', mood: 'refreshing' },
        base_price: 8.49,
        image_url: 'https://images.unsplash.com/photo-1600428877878-1a0ff561d8b9?w=800&q=80',
        is_featured: false,
        tags: 'eucalyptus,mint,fresh',
        variants: [
          { name: '6 Pack', sku: 'DEMO-WM-EUCALYPTUS-6', price: 8.49, inventory: 55 },
          { name: '12 Pack', sku: 'DEMO-WM-EUCALYPTUS-12', price: 15.99, inventory: 40 },
        ]
      },

      // === CANDLES ===
      {
        name: 'Demo: Desert Rose Candle',
        description: 'A sophisticated soy candle with damask rose, smoky oud, and a base of warm amber. Hand-poured with a crackling wooden wick for an authentic fireside feel.',
        scent_profile: { top: ['bergamot', 'pink pepper'], heart: ['damask rose', 'geranium'], base: ['oud', 'amber', 'sandalwood'], intensity: 'strong', mood: 'luxurious' },
        base_price: 24.99,
        image_url: 'https://images.unsplash.com/photo-1602607450896-4092afd6a193?w=800&q=80',
        is_featured: true,
        tags: 'rose,candle,luxury',
        weight_grams: 300,
        variants: [
          { name: '8oz / ~40hrs', sku: 'DEMO-CANDLE-ROSE-8', price: 24.99, inventory: 20 },
          { name: '12oz / ~60hrs', sku: 'DEMO-CANDLE-ROSE-12', price: 34.99, inventory: 15 },
        ]
      },
      {
        name: 'Demo: Coastal Driftwood',
        description: 'Fresh sea salt and driftwood with notes of white tea and light musk. A clean, oceanic scent that brings the beach indoors, any time of year.',
        scent_profile: { top: ['sea salt', 'bergamot'], heart: ['white tea', 'lavender'], base: ['driftwood', 'white musk'], intensity: 'light', mood: 'fresh' },
        base_price: 22.99,
        image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80',
        is_featured: false,
        tags: 'oceanic,fresh,coastal',
        weight_grams: 280,
        variants: [
          { name: '8oz / ~40hrs', sku: 'DEMO-CANDLE-COASTAL-8', price: 22.99, inventory: 25 },
          { name: '12oz / ~60hrs', sku: 'DEMO-CANDLE-COASTAL-12', price: 32.99, inventory: 18 },
        ]
      },
      {
        name: 'Demo: Spiced Mulled Wine',
        description: 'Rich red wine reduction with cinnamon sticks, star anise, and orange peel. A festive favourite that fills your home with Christmas market magic.',
        scent_profile: { top: ['red wine', 'orange peel'], heart: ['cinnamon', 'star anise'], base: ['clove', 'vanilla pod'], intensity: 'strong', mood: 'festive' },
        base_price: 26.99,
        image_url: 'https://images.unsplash.com/photo-1604671801908-6f0c6a0928a1?w=800&q=80',
        is_featured: true,
        tags: 'winter,spiced,festive',
        weight_grams: 320,
        variants: [
          { name: '8oz / ~40hrs', sku: 'DEMO-CANDLE-MULLED-8', price: 26.99, inventory: 30 },
          { name: '12oz / ~60hrs', sku: 'DEMO-CANDLE-MULLED-12', price: 36.99, inventory: 20 },
        ]
      },

      // === BATH BOMBS ===
      {
        name: 'Demo: Lavender Dreams Bath Bomb',
        description: 'A generous bath bomb bursting with French lavender essential oil, chamomile, and oat extract. Leaves skin soft, silky, and deeply relaxed.',
        scent_profile: { top: ['lavender', 'chamomile'], heart: ['oat milk', 'honey'], base: ['vanilla', 'shea'], intensity: 'medium', mood: 'relaxing' },
        base_price: 6.99,
        image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=800&q=80',
        is_featured: true,
        tags: 'lavender,relaxing,bath',
        variants: [
          { name: 'Single', sku: 'DEMO-BATH-LAVENDER-1', price: 6.99, inventory: 80 },
          { name: 'Box of 3', sku: 'DEMO-BATH-LAVENDER-3', price: 18.99, inventory: 40 },
        ]
      },
      {
        name: 'Demo: Citrus Sunrise Fizz',
        description: 'A vibrant, colour-releasing bath bomb with sweet orange, pink grapefruit, and a core of nourishing cocoa butter. Start your day with a burst of energy.',
        scent_profile: { top: ['orange', 'grapefruit'], heart: ['tangerine', 'bitter lemon'], base: ['cocoa butter', 'sandalwood'], intensity: 'light', mood: 'energising' },
        base_price: 6.99,
        image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        is_featured: false,
        tags: 'citrus,energising,bath',
        variants: [
          { name: 'Single', sku: 'DEMO-BATH-CITRUS-1', price: 6.99, inventory: 75 },
          { name: 'Box of 3', sku: 'DEMO-BATH-CITRUS-3', price: 18.99, inventory: 35 },
        ]
      },
      {
        name: 'Demo: Midnight Rose Bath Bomb',
        description: 'A deep, colour-swatching bath bomb with damask rose, burgundy shimmer, and a heart of dark berry. For those who like their baths dramatic and luxurious.',
        scent_profile: { top: ['rose petals', 'berry'], heart: ['dark currant', 'peony'], base: ['patchouli', 'rose geranium'], intensity: 'strong', mood: 'indulgent' },
        base_price: 7.49,
        image_url: 'https://images.unsplash.com/photo-1600428877878-1a0ff561d8b9?w=800&q=80',
        is_featured: false,
        tags: 'rose,luxury,bath',
        variants: [
          { name: 'Single', sku: 'DEMO-BATH-ROSE-1', price: 7.49, inventory: 50 },
          { name: 'Box of 3', sku: 'DEMO-BATH-ROSE-3', price: 20.99, inventory: 25 },
        ]
      },

      // === DIFFUSERS ===
      {
        name: 'Demo: Wild Fig & Cassis Reed Diffuser',
        description: 'An elegant reed diffuser with ripe figs, blackcurrant, and a grounding base of cedar and vetiver. Long-lasting fragrance for living rooms and bedrooms.',
        scent_profile: { top: ['fig leaf', 'blackcurrant'], heart: ['fig fruit', 'violet'], base: ['cedar', 'vetiver', 'amber'], intensity: 'medium', mood: 'sophisticated' },
        base_price: 18.99,
        image_url: 'https://images.unsplash.com/photo-1595783956520-b80bbd10c6b4?w=800&q=80',
        is_featured: true,
        tags: 'fig,reeds,home fragrance',
        variants: [
          { name: '100ml', sku: 'DEMO-DIFF-FIG-100', price: 18.99, inventory: 30 },
          { name: '200ml', sku: 'DEMO-DIFF-FIG-200', price: 28.99, inventory: 20 },
        ]
      },
      {
        name: 'Demo: Cedar & Sage Room Spray',
        description: 'A calming room spray with atlas cedar, clary sage, and a touch of white tea. Mist into the air for an instant atmosphere of calm and clarity.',
        scent_profile: { top: ['white tea', 'clary sage'], heart: ['cedar', 'vetiver'], base: ['white musk', 'amber'], intensity: 'light', mood: 'calming' },
        base_price: 14.99,
        image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
        is_featured: false,
        tags: 'cedar,sage,fresh',
        variants: [
          { name: '100ml Spray', sku: 'DEMO-DIFF-SPRAY-100', price: 14.99, inventory: 40 },
          { name: '200ml Spray', sku: 'DEMO-DIFF-SPRAY-200', price: 22.99, inventory: 25 },
        ]
      },
    ];

    const categorySlugMap = {
      'wax-melts': catMap['wax-melts'],
      'candles': catMap['candles'],
      'bath-bombs': catMap['bath-bombs'],
      'diffusers': catMap['diffusers'],
    };

    let productCount = 0;
    let variantCount = 0;

    for (const product of demoProducts) {
      // Determine category from tags
      let categoryId = catMap['wax-melts'];
      if (product.tags.includes('candle')) categoryId = catMap['candles'];
      else if (product.tags.includes('bath')) categoryId = catMap['bath-bombs'];
      else if (product.tags.includes('reeds') || product.tags.includes('diffuser') || product.tags.includes('spray')) categoryId = catMap['diffusers'];
      else if (product.tags.includes('citrus') || product.tags.includes('energising')) categoryId = catMap['wax-melts'];
      else if (product.tags.includes('lavender') || product.tags.includes('rose')) categoryId = catMap['wax-melts'];

      // Insert product
      const prodResult = await client.query(`
        INSERT INTO products (name, description, scent_profile, base_price, image_url, is_featured, is_active, tags, weight_grams)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
        RETURNING id
      `, [
        product.name,
        product.description,
        JSON.stringify(product.scent_profile),
        product.base_price,
        product.image_url,
        product.is_featured || false,
        product.tags,
        product.weight_grams || null
      ]);

      const productId = prodResult.rows[0].id;
      productCount++;

      // Link to category
      await client.query(`
        INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)
      `, [productId, categoryId]);

      // Insert variants and inventory
      for (const variant of product.variants) {
        const varResult = await client.query(`
          INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          productId,
          variant.sku,
          variant.name,
          variant.price,
          variant.inventory,
          JSON.stringify({ weight: variant.name.includes('12') || variant.name.includes('200') || variant.name.includes('12oz') ? 'large' : 'standard' })
        ]);

        const variantId = varResult.rows[0].id;
        variantCount++;

        // Insert inventory for PWA channel
        await client.query(`
          INSERT INTO inventory (product_id, channel_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (product_id, channel_id) DO UPDATE SET quantity = $3
        `, [variantId, pwaChannelId, variant.inventory]);
      }

      console.log(`  ✓ ${product.name} (${product.variants.length} variants)`);
    }

    await client.query('COMMIT');
    console.log(`\nSeed complete: ${productCount} products, ${variantCount} variants across 4 categories`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

seed().catch(() => process.exit(1));
