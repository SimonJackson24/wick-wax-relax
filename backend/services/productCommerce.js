// Commerce-field persistence for product updates.
//
// The base updateProduct() in services/product.js owns the core product
// row (name/slug/description/price/categories/variants, transactional).
// The migration-021/022/023 commerce columns (status, VAT, SEO, CLP,
// shipping, exemption, fragrance load) are persisted here so the write
// path stays composed of small, fully-static parameterized statements.
// Called by the admin PUT route immediately after updateProduct(); values
// are validated upstream by the express-validator chain.

const { query } = require('../config/database');
const { commerceParams } = require('./product');

async function applyCommerceFields(productId, data) {
  const commerce = commerceParams(data);

  await query(
    `UPDATE products
        SET status = ?,
            vat_rate = ?,
            meta_title = ?,
            meta_description = ?,
            weight_grams = ?,
            dimensions_cm = ?,
            clp_allergens = ?,
            clp_hazard_pictograms = ?,
            clp_signal_word = ?,
            clp_hazard_statements = ?,
            clp_precautionary_statements = ?,
            ufi_code = ?,
            clp_responsible_name = ?,
            clp_exempt = ?,
            fragrance_load_percent = ?,
            updated_at = NOW()
      WHERE id = ?`,
    [
      commerce.status,
      commerce.vat_rate,
      commerce.meta_title,
      commerce.meta_description,
      commerce.weight_grams,
      commerce.dimensions_cm,
      commerce.clp_allergens,
      commerce.clp_hazard_pictograms,
      commerce.clp_signal_word,
      commerce.clp_hazard_statements,
      commerce.clp_precautionary_statements,
      commerce.ufi_code,
      commerce.clp_responsible_name,
      data.clp_exempt === true,
      commerce.fragrance_load_percent,
      productId,
    ]
  );
}

module.exports = { applyCommerceFields };
