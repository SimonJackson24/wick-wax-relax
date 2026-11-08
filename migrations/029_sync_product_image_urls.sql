-- Migration: 029_sync_product_image_urls.sql
-- Points products.image_url at the self-hosted optimized photos (matching
-- the product_images rows migrated in 028). products.image_url feeds the
-- homepage hero/bestseller cards and PDP SEO tags; the old values were
-- unsplash hotlinks and references to heavy/deleted local files
-- (hero2.png was removed from the build, breaking that gallery image).

UPDATE products
   SET image_url = '/images/products/' || slug || '.jpg'
 WHERE image_url LIKE 'https://images.unsplash.com/%'
    OR image_url IN ('/images/hero2.png', '/images/hero1.jpg', '/images/wax-melts.png');
