const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { param, body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Per-user rate limit on review submission. Prevents a single account from
// spamming reviews of the same (or any) product. The keyGenerator uses the
// authenticated userId so anonymous floods are also blocked because the
// authenticateToken middleware in front of this rejects unauthenticated
// requests with 401 before they reach the limiter.
const reviewSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                   // 5 reviews per hour per user
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reviews submitted, please try again later' },
  keyGenerator: (req) => (req.user && req.user.userId) ? String(req.user.userId) : req.ip
});

router.get('/:id/reviews', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const statsResult = await query(`
      SELECT
        COALESCE(AVG(r.rating), 0)::float AS average_rating,
        COUNT(r.id)::int AS review_count
      FROM reviews r
      WHERE r.product_id = $1
    `, [id]);

    const { average_rating: averageRating, review_count: reviewCount } = statsResult.rows[0];

    // Rating distribution for the PDP histogram (5→1). Every bucket is
    // returned so the bars always add up to review_count.
    const distributionResult = await query(`
      SELECT r.rating, COUNT(r.id)::int AS count
      FROM reviews r
      WHERE r.product_id = $1
      GROUP BY r.rating
    `, [id]);
    const distributionMap = Object.fromEntries(distributionResult.rows.map((row) => [row.rating, row.count]));
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      rating: star,
      count: distributionMap[star] || 0,
    }));

    // Sort: fixed literal whitelist — the incoming value only SELECTS a
    // constant, never enters the SQL text. Optional star filter is a bound
    // parameter.
    const sortByRaw = String(req.query.sortBy || 'recent');
    const orderByLiteral = sortByRaw === 'highest'
      ? 'r.rating DESC, r.created_at DESC'
      : sortByRaw === 'lowest'
        ? 'r.rating ASC, r.created_at DESC'
        : sortByRaw === 'helpful'
          ? 'r.helpful_count DESC, r.created_at DESC'
          : 'r.created_at DESC';
    const ratingFilter = [1, 2, 3, 4, 5].includes(parseInt(req.query.rating, 10))
      ? parseInt(req.query.rating, 10)
      : null;

    const reviewsResult = await query(`
      SELECT
        r.id,
        r.rating,
        r.title,
        r.review_text,
        r.verified_purchase,
        r.photo_url,
        r.helpful_count,
        r.created_at,
        COALESCE(u.first_name || ' ' || u.last_name, 'Verified Customer') AS reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
        AND ($4::int IS NULL OR r.rating = $4)
      ORDER BY ${orderByLiteral}
      LIMIT $2 OFFSET $3
    `, ratingFilter ? [id, limit, offset, ratingFilter] : [id, limit, offset, null]);

    res.json({
      reviews: reviewsResult.rows,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount,
      distribution,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Customer review photos: one image per review, strict validation —
// same shape as the admin product-image pipeline (blocked extensions,
// image/* mimetype, sharp re-verification on disk) but capped tighter.
const reviewPhotoDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(reviewPhotoDir)) {
  fs.mkdirSync(reviewPhotoDir, { recursive: true });
}
const REVIEW_PHOTO_BLOCKED = new Set(['.svg', '.html', '.htm', '.js', '.php', '.exe', '.bat', '.sh', '.ps1']);
const reviewPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, reviewPhotoDir),
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
      cb(null, `review-${req.user.userId}-${Date.now()}${safeExt}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const err = new Error(REVIEW_PHOTO_BLOCKED.has(ext) ? 'File type not allowed' : 'Only image files are allowed');
    err.status = 400;
    if (REVIEW_PHOTO_BLOCKED.has(ext) || !file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(err, false);
    }
    cb(null, true);
  },
});

router.post('/:id/reviews/photo', authenticateToken, reviewSubmissionLimiter, (req, res) => {
  reviewPhotoUpload.single('photo')(req, res, async (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 400);
      return res.status(status).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }
    try {
      // Re-verify on-disk content is a real raster image (defeats
      // mimetype spoofing), then normalise to a web-safe JPEG.
      const metadata = await sharp(req.file.path).metadata();
      if (!['jpeg', 'png', 'webp', 'gif', 'avif'].includes(metadata.format)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File is not a valid image' });
      }
      const normalised = path.join(reviewPhotoDir, `${path.parse(req.file.filename).name}.jpg`);
      await sharp(req.file.path).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(normalised);
      fs.unlinkSync(req.file.path);
      return res.status(201).json({ photoUrl: `/uploads/reviews/${path.basename(normalised)}` });
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch { /* already gone */ }
      return res.status(400).json({ error: 'File is not a valid image' });
    }
  });
});

router.post('/:id/reviews', authenticateToken, reviewSubmissionLimiter, [
  param('id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isString().isLength({ max: 200 }),
  body('comment').optional().isString().isLength({ max: 2000 }),
  body('photo_url').optional().isString().matches(/^\/uploads\/reviews\/[a-zA-Z0-9._-]+\.jpg$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: productId } = req.params;
    const { rating, title, comment, photo_url: photoUrl } = req.body;

    const productCheck = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // authenticateToken guarantees req.user is populated; if it ever is
    // not, this is a server bug and we fail closed (no anonymous reviews).
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to submit a review' });
    }
    let verifiedPurchase = false;
    const orderCheck = await query(`
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE o.user_id = $1 AND pv.product_id = $2
        LIMIT 1
      `, [userId, productId]);
    verifiedPurchase = orderCheck.rows.length > 0;

    const upsertResult = await query(`
      INSERT INTO reviews (product_id, user_id, rating, title, review_text, verified_purchase, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (product_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        title = EXCLUDED.title,
        review_text = EXCLUDED.review_text,
        photo_url = COALESCE(EXCLUDED.photo_url, reviews.photo_url),
        verified_purchase = GREATEST(reviews.verified_purchase, EXCLUDED.verified_purchase),
        updated_at = NOW()
      RETURNING id, rating, title, review_text, verified_purchase, photo_url, helpful_count, created_at, updated_at
    `, [productId, userId, rating, title || null, comment || null, verifiedPurchase, photoUrl || null]);

    res.status(201).json(upsertResult.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.get('/', async (req, res) => {
  try {
    // Storefront: ACTIVE products only; commerce fields power the PDP's
    // CLP panel, SEO overrides, and weight/dimension display.
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.clp_exempt,
        p.fragrance_load_percent,
        p.created_at
      FROM products p
      WHERE p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT
          id,
          sku,
          name,
          price,
          inventory_quantity,
          attributes
        FROM product_variants
        WHERE product_id = $1
      `, [product.id]);

      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.clp_exempt,
        p.fragrance_load_percent,
        p.rrp,
        p.created_at,
        p.is_featured
      FROM products p
      WHERE p.is_featured = true AND p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json({ products: products.rows });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

router.get('/new', async (req, res) => {
  try {
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.clp_exempt,
        p.fragrance_load_percent,
        p.created_at
      FROM products p
      WHERE p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching new products:', error);
    res.status(500).json({ error: 'Failed to fetch new products' });
  }
});

router.get('/related/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const categories = await query(`
      SELECT c.id FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = $1
    `, [id]);

    if (categories.rows.length === 0) {
      return res.json([]);
    }

    const categoryIds = categories.rows.map(r => r.id);

    const relatedProducts = await query(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.clp_exempt,
        p.fragrance_load_percent,
        p.created_at
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE pc.category_id = ANY($1)
        AND p.id != $2
        AND p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
      LIMIT 8
    `, [categoryIds, id]);

    for (let product of relatedProducts.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(relatedProducts.rows);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;

    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.clp_exempt,
        p.fragrance_load_percent,
        p.created_at
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      INNER JOIN categories c ON pc.category_id = c.id
      WHERE c.slug = $1 AND p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
    `, [categorySlug]);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT
          id,
          sku,
          name,
          price,
          inventory_quantity,
          attributes
        FROM product_variants
        WHERE product_id = $1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/categories/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        display_order
      FROM categories
      ORDER BY display_order, name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Frequently Bought Together
router.get('/:id/fbt', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Get the product's category
    const categories = await query(`
      SELECT c.id FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `, [id]);

    let fbtProducts = [];

    if (categories.rows.length > 0) {
      const categoryIds = categories.rows.map(r => r.id);

      // Get up to 4 products from same category, excluding current
      const sameCategory = await query(`
        SELECT DISTINCT
          p.id,
          p.name,
          p.slug,
          p.description,
          p.base_price,
          p.created_at
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id = ANY($1)
          AND p.id != $2
        ORDER BY p.created_at DESC
        LIMIT 4
      `, [categoryIds, id]);

      fbtProducts = sameCategory.rows;
    }

    // If fewer than 4, fill with random products from other categories
    if (fbtProducts.length < 4) {
      const existingIds = [id, ...fbtProducts.map(p => p.id)];
      const remaining = await query(`
        SELECT id, name, slug, description, base_price
        FROM products
        WHERE id != ALL($1)
        ORDER BY RANDOM()
        LIMIT $2
      `, [existingIds, 4 - fbtProducts.length]);

      fbtProducts = [...fbtProducts, ...remaining.rows];
    }

    // Attach first variant to each product
    for (let product of fbtProducts) {
      const variants = await query(`
        SELECT id, name, price, inventory_quantity
        FROM product_variants
        WHERE product_id = ?
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(fbtProducts);
  } catch (error) {
    console.error('Error fetching FBT products:', error);
    res.status(500).json({ error: 'Failed to fetch frequently bought together products' });
  }
});


// Slug-based product lookup (SEO-friendly URLs)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await query(`
      SELECT
        id,
        name,
        slug,
        description,
        scent_profile,
        base_price,
        status,
        vat_rate,
        meta_title,
        meta_description,
        weight_grams,
        dimensions_cm,
        clp_allergens,
        clp_hazard_pictograms,
        clp_signal_word,
        clp_hazard_statements,
        clp_precautionary_statements,
        ufi_code,
        clp_responsible_name,
        clp_exempt,
        fragrance_load_percent,
        created_at
      FROM products
      WHERE slug = $1 AND status = 'ACTIVE'
    `, [slug]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = await query(`
      SELECT
        id,
        sku,
        name,
        price,
        inventory_quantity,
        attributes
      FROM product_variants
      WHERE product_id = $1
    `, [product.rows[0].id]);

    const result = { ...product.rows[0], variants: variants.rows };
    res.json(result);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// MUST be last (catch-all for UUIDs)
router.get('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const product = await query(`
      SELECT
        id,
        name,
        slug,
        description,
        scent_profile,
        base_price,
        status,
        vat_rate,
        meta_title,
        meta_description,
        weight_grams,
        dimensions_cm,
        clp_allergens,
        clp_hazard_pictograms,
        clp_signal_word,
        clp_hazard_statements,
        clp_precautionary_statements,
        ufi_code,
        clp_responsible_name,
        clp_exempt,
        fragrance_load_percent,
        created_at
      FROM products
      WHERE id = $1 AND status = 'ACTIVE'
    `, [id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = await query(`
      SELECT
        id,
        sku,
        name,
        price,
        inventory_quantity,
        attributes
      FROM product_variants
      WHERE product_id = $1
    `, [id]);

    const result = { ...product.rows[0], variants: variants.rows };

    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;