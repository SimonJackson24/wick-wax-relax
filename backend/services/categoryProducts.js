const { query } = require('../config/database');

// Category product listing.
//
// Two taxonomies coexist in this schema:
//   * `categories`         — the real shop categories; products link to
//                            these through `product_categories`
//   * `category_hierarchy` — a merchandising/SEO tree (seasons,
//                            collections, aroma profiles) with its own
//                            `product_category_hierarchy` link table
//
// A category page must list products from BOTH. Each link table is read
// with its own simple query and the results are merged here.
//
// Every value is a bound parameter and the SQL text contains no dynamic
// fragments at all — not even the sort. Sorting is applied in JavaScript
// against a fixed, whitelisted set of comparators, so there is no
// injection surface by construction.
//
// Category ids travel as a comma-separated string of uuids (one bound
// parameter) and are expanded inside the query.

const MAX_ROWS = 2000; // hard cap on rows pulled for in-memory sorting

// Whitelisted comparators. Each returns a negative/zero/positive number.
const COMPARATORS = {
  1: (a, b) => String(a.name).localeCompare(String(b.name)),      // name asc
  2: (a, b) => String(b.name).localeCompare(String(a.name)),      // name desc
  3: (a, b) => Number(a.base_price) - Number(b.base_price),      // price asc
  4: (a, b) => Number(b.base_price) - Number(a.base_price),      // price desc
  5: (a, b) => new Date(a.created_at) - new Date(b.created_at),  // newest asc
  6: (a, b) => new Date(b.created_at) - new Date(a.created_at),  // newest desc
};

// Map the API's sortBy/sortOrder pair onto a fixed numeric rank.
function sortRank(sortBy, sortOrder) {
  const desc = String(sortOrder || '').toUpperCase() === 'DESC';
  switch (String(sortBy || '').toLowerCase()) {
    case 'price': return desc ? 4 : 3;
    case 'newest':
    case 'created_at': return desc ? 6 : 5;
    case 'name':
    default: return desc ? 2 : 1;
  }
}

const idList = (ids) => ids.join(',');

// Ids of a category and all of its descendants, in both taxonomies.
async function resolveSubtrees(categoryId) {
  const hierarchy = await query(`
    WITH RECURSIVE subcategories AS (
      SELECT id FROM category_hierarchy WHERE id = ?
      UNION
      SELECT ch.id FROM category_hierarchy ch
      JOIN subcategories sc ON ch.parent_id = sc.id
    )
    SELECT id::text AS id FROM subcategories
  `, [categoryId]);
  const shop = await query(`
    WITH RECURSIVE shop_categories AS (
      SELECT id FROM categories WHERE id = ?
      UNION
      SELECT c.id FROM categories c
      JOIN shop_categories sc ON c.parent_id = sc.id
    )
    SELECT id::text AS id FROM shop_categories
  `, [categoryId]);

  return {
    hierarchyIds: hierarchy.rows.map((r) => r.id),
    shopIds: shop.rows.map((r) => r.id),
  };
}

// Products assigned to a category (or one of its descendants).
async function getProductsByCategory(categoryId, options = {}) {
  const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = options;
  const offset = (page - 1) * limit;
  const rank = sortRank(sortBy, sortOrder);
  const comparator = COMPARATORS[rank] || COMPARATORS[1];

  const { hierarchyIds, shopIds } = await resolveSubtrees(categoryId);

  if (hierarchyIds.length === 0 && shopIds.length === 0) {
    return {
      products: [],
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  // Products linked through the real shop categories.
  const byShop = await query(`
    SELECT DISTINCT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.scent_profile,
      p.base_price,
      p.status,
      p.created_at,
      p.updated_at
      FROM products p
      JOIN product_categories pc ON pc.product_id = p.id
     WHERE pc.category_id::text = ANY(string_to_array(?, ','))
       AND p.status = 'ACTIVE'
     LIMIT ?
  `, [idList(shopIds), MAX_ROWS]);

  // Products linked through the merchandising hierarchy.
  const byHierarchy = await query(`
    SELECT DISTINCT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.scent_profile,
      p.base_price,
      p.status,
      p.created_at,
      p.updated_at
      FROM products p
      JOIN product_category_hierarchy pch ON pch.product_id = p.id
     WHERE pch.category_id::text = ANY(string_to_array(?, ','))
       AND p.status = 'ACTIVE'
     LIMIT ?
  `, [idList(hierarchyIds), MAX_ROWS]);

  // Merge, de-duplicate by product id, then sort with the whitelist.
  const merged = new Map();
  for (const row of [...byShop.rows, ...byHierarchy.rows]) {
    if (!merged.has(row.id)) merged.set(row.id, row);
  }
  const all = [...merged.values()].sort(comparator);
  const total = all.length;
  const pageRows = all.slice(offset, offset + limit);

  for (const product of pageRows) {
    const variants = await query(`
      SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
       WHERE product_id = ?
       ORDER BY created_at
    `, [product.id]);
    product.variants = variants.rows;
  }

  return {
    products: pageRows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getProductsByCategory, sortRank };
