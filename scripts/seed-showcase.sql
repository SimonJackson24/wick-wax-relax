-- Showcase seed — 8 products with everything the new homepage renders:
-- RRP (Save % badge), weight (per-100g pricing), scent notes, stock
-- urgency, verified reviews and complete CLP data.
--
-- Static dataset (no dynamic input) so it can be run with psql directly:
--   docker exec -i <pg-container> psql -U wickwax -d wick_wax_relax < seed-showcase.sql
--
-- Idempotent: removes and recreates any product whose name starts with
-- "Showcase:".

BEGIN;

-- Clean previous run
DELETE FROM reviews WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Showcase:%');
DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Showcase:%');
DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Showcase:%');
DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'Showcase:%');
DELETE FROM products WHERE name LIKE 'Showcase:%';

-- Reviewer (for verified reviews)
INSERT INTO users (id, email, password_hash, first_name, last_name)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'shopper@wickwaxrelax.co.uk',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYBMiWiS/hS9Nu',
  'Amelia', 'Hart'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

DO $$
DECLARE
  p record;
  pid uuid;
  cat uuid;
  reviewer uuid := 'a1b2c3d4-0001-4000-8000-000000000001';
BEGIN
  FOR p IN SELECT * FROM (VALUES
    ('Showcase: Lavender Dream', 'lavender-dream',
     'Calming lavender with a soft vetiver base and a whisper of cedar. Hand-poured in a small batch and cured for fourteen days so the scent lasts all evening.',
     '{"top":"Lavender","heart":"Clary sage","base":"Vetiver, cedar"}'::jsonb,
     12.00, 15.00, 220, 10, 'https://images.unsplash.com/photo-1602874801006-e26c8c2d0dc1?w=900&q=80',
     true, 3, 'candles',
     '["GHS02","GHS07"]'::jsonb, '["Linalool","Coumarin"]'::jsonb, 'WARNING',
     '["H226","H317"]'::jsonb, '["P102","P210","P280"]'::jsonb),
    ('Showcase: Fireside Vanilla', 'fireside-vanilla',
     'Madagascan vanilla pod, smoked tonka bean and clove. The candle equivalent of a log fire on a cold night — warm, comforting and slow to fade.',
     '{"top":"Tonka bean","heart":"Cinnamon","base":"Vanilla, amber"}'::jsonb,
     13.50, NULL, 220, 10, 'https://images.unsplash.com/photo-1603006905003-be47e6e6e5b1?w=900&q=80',
     true, 18, 'candles',
     '["GHS02","GHS07","GHS09"]'::jsonb, '["Citral","Linalool","Eugenol","Geraniol"]'::jsonb, 'WARNING',
     '["H226","H317","H411"]'::jsonb, '["P102","P210","P273","P280"]'::jsonb),
    ('Showcase: Midnight Jasmine', 'midnight-jasmine',
     'Night-blooming jasmine with ylang-ylang and sandalwood. Intoxicating without being loud — a scent that turns a room into a sanctuary.',
     '{"top":"Jasmine","heart":"Ylang-ylang","base":"Sandalwood, oud"}'::jsonb,
     14.00, 17.50, 220, 10, 'https://images.unsplash.com/photo-1596433809252-2b8e0e5b3c14?w=900&q=80',
     true, 12, 'candles',
     '["GHS07","GHS09"]'::jsonb, '["Linalool","Eugenol"]'::jsonb, 'WARNING',
     '["H317","H411"]'::jsonb, '["P102","P273","P280"]'::jsonb),
    ('Showcase: Amber & Oak', 'amber-and-oak',
     'Golden amber, toasted oak and a little smoked vanilla. Our richest pour — the one people come back for.',
     '{"top":"Bergamot","heart":"Nutmeg","base":"Amber, oak, vanilla"}'::jsonb,
     15.00, 18.75, 280, 12, 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=900&q=80',
     true, 2, 'candles',
     '["GHS02","GHS07","GHS09"]'::jsonb, '["Citral","Linalool","Eugenol","Geraniol"]'::jsonb, 'WARNING',
     '["H226","H317","H411"]'::jsonb, '["P102","P210","P273","P280"]'::jsonb),
    ('Showcase: Sea Salt & Sage', 'sea-salt-and-sage',
     'Mineral sea salt with dry sage and a cool eucalyptus finish. Clean, green and uncluttered — the reset candle.',
     '{"top":"Sea salt","heart":"Sage","base":"Eucalyptus, musk"}'::jsonb,
     12.50, NULL, 220, 8, 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=900&q=80',
     true, 24, 'wax-melts',
     '["GHS07"]'::jsonb, '["Citronellol","Geraniol"]'::jsonb, 'WARNING',
     '["H317"]'::jsonb, '["P102","P280"]'::jsonb),
    ('Showcase: Blood Orange & Fig', 'blood-orange-and-fig',
     'Ripe blood orange against soft fig and cedarwood. Bright without being sharp — our brightest pour, and a favourite for slow mornings.',
     '{"top":"Blood orange","heart":"Fig leaf","base":"Cedar, amber"}'::jsonb,
     11.50, 14.50, 200, 9, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&q=80',
     false, 30, 'wax-melts',
     '["GHS02","GHS07"]'::jsonb, '["Linalool","Coumarin"]'::jsonb, 'WARNING',
     '["H226","H317"]'::jsonb, '["P102","P210","P280"]'::jsonb),
    ('Showcase: Rose Cashmere', 'rose-cashmere',
     'Soft rose wrapped in cashmere musk with a hint of vanilla. Our gentlest scent — comfort in a jar.',
     '{"top":"Rose","heart":"Peony","base":"Cashmere musk, vanilla"}'::jsonb,
     13.00, NULL, 220, 10, 'https://images.unsplash.com/photo-1512418490979-92798cec1380?w=900&q=80',
     false, 9, 'wax-melts',
     '["GHS07","GHS09"]'::jsonb, '["Linalool","Eugenol"]'::jsonb, 'WARNING',
     '["H317","H411"]'::jsonb, '["P102","P273","P280"]'::jsonb),
    ('Showcase: Sandalwood Smoke', 'sandalwood-smoke',
     'Sandalwood, dry cedar and a thread of smoke. Deep and grounding — our most requested scent for the last two seasons.',
     '{"top":"Black pepper","heart":"Cedar","base":"Sandalwood, smoke"}'::jsonb,
     16.00, 20.00, 280, 12, 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=900&q=80',
     false, 5, 'candles',
     '["GHS02","GHS07","GHS09"]'::jsonb, '["Citral","Linalool","Eugenol","Geraniol"]'::jsonb, 'WARNING',
     '["H226","H317","H411"]'::jsonb, '["P102","P210","P273","P280"]'::jsonb)
  ) AS t(name, slug, description, scent_profile, base_price, rrp, weight_grams,
         load_pct, image_url, is_featured, stock, category, pictograms, allergens,
         signal_word, h_codes, p_codes)
  LOOP
    INSERT INTO products (
      name, slug, description, scent_profile, base_price, rrp, status, vat_rate,
      meta_title, meta_description, weight_grams, clp_allergens,
      clp_hazard_pictograms, clp_signal_word, clp_hazard_statements,
      clp_precautionary_statements, clp_responsible_name, clp_exempt,
      fragrance_load_percent, image_url, image_alt_text, is_featured, is_active
    ) VALUES (
      p.name, p.slug, p.description, p.scent_profile, p.base_price, p.rrp, 'ACTIVE', 20.00,
      p.name || ' | Wick Wax & Relax', left(p.description, 155), p.weight_grams, p.allergens,
      p.pictograms, p.signal_word, p.h_codes, p.p_codes,
      'Wick Wax & Relax Ltd', FALSE, p.load_pct, p.image_url,
      left(replace(p.name, 'Showcase: ', ''), 240), p.is_featured, TRUE
    ) RETURNING id INTO pid;

    INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes)
    VALUES (pid, 'SHO-' || upper(replace(p.slug, '-', '')), 'Single', p.base_price, p.stock,
            jsonb_build_object('size', p.weight_grams || 'g', 'burnTime', '40 hours'));

    SELECT id INTO cat FROM categories WHERE slug = p.category AND parent_id IS NULL LIMIT 1;
    IF cat IS NOT NULL THEN
      INSERT INTO product_categories (product_id, category_id) VALUES (pid, cat);
    END IF;

    INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
    VALUES (pid, p.image_url, left(replace(p.name, 'Showcase: ', ''), 240), TRUE, 0);

    INSERT INTO reviews (product_id, user_id, rating, title, review_text, verified_purchase)
    VALUES (pid, reviewer, 5, 'The scent is beautiful',
            'It fills the whole room in about twenty minutes and it still smells good the next morning. Worth every penny.',
            TRUE);

    INSERT INTO reviews (product_id, user_id, rating, title, review_text, verified_purchase)
    VALUES (pid, reviewer, 5, 'Better than the high street',
            'I bought three from a boutique and honestly this one lasts longer and smells rounder.',
            TRUE)
    ON CONFLICT (product_id, user_id) DO NOTHING;
  END LOOP;
END $$;

COMMIT;
