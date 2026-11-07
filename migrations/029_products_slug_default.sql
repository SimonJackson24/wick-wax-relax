-- Migration: 029_products_slug_default.sql
-- products.slug is NOT NULL but had no DEFAULT, so any INSERT that didn't
-- supply a slug failed with a not-null violation (the demo/showcase seeds
-- hit exactly this). A BEFORE INSERT trigger now fills it from the product
-- name, so inserts can never leave it empty.
--
-- Postgres does not allow column references in DEFAULT expressions, hence
-- the trigger. The function mirrors the app-level slug rules (lowercase,
-- non-alphanumerics collapsed to a single hyphen). Uniqueness is still
-- enforced by the unique index — the trigger supplies a best-effort first
-- value and the service layer resolves collisions with -2/-3 suffixes.

CREATE OR REPLACE FUNCTION slugify_product_name(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base text;
BEGIN
  IF input IS NULL OR trim(input) = '' THEN
    RETURN 'product';
  END IF;

  base := trim(both '-' FROM regexp_replace(lower(input), '[^a-z0-9]+', '-', 'g'));
  IF base = '' THEN
    RETURN 'product';
  END IF;
  RETURN left(base, 200);
END;
$$;

CREATE OR REPLACE FUNCTION set_product_slug_if_missing()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := slugify_product_name(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_slug ON products;
CREATE TRIGGER products_set_slug
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_slug_if_missing();
