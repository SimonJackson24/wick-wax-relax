-- Migration: 028_self_host_product_images.sql
-- Replaces the seeded third-party (images.unsplash.com) product photo URLs
-- and three references to heavy/deleted local files with self-hosted,
-- optimized images under /images/products/. Hotlinking unsplash in
-- production was fragile (third-party availability, oversized w=900
-- payloads) and one product pointed at /images/hero2.png which was removed
-- from the build (broken gallery image).
--
-- One row per product in product_images; matched via the product slug.
-- Idempotent: rows already pointing at /images/products/ are untouched.

UPDATE product_images pi
   SET image_url = '/images/products/' || p.slug || '.jpg'
  FROM products p
 WHERE pi.product_id = p.id
   AND (pi.image_url LIKE 'https://images.unsplash.com/%'
        OR pi.image_url IN ('/images/hero2.png', '/images/hero1.jpg', '/images/wax-melts.png'));
