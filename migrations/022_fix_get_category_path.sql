-- Migration: 022_fix_get_category_path.sql
-- Fixes get_category_path(), which has been broken since migration 012.
--
-- The recursive CTE selected (id, name, level, id_path, name_path) but the
-- recursive step joins `ON c.id = ct.parent_id` — parent_id was never part
-- of the CTE's column list, so Postgres raised
--   "column ct.parent_id does not exist"
-- every time the storefront asked for a category's breadcrumb path (the
-- category pages are the only caller). The broken function was silently
-- tolerated by the migration runner's error tolerance.
--
-- The fix adds parent_id to the CTE and rebuilds the path root -> leaf.

CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TABLE(path_id UUID, path_name VARCHAR, path_level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT
      id,
      name,
      level,
      parent_id,
      ARRAY[id]             AS id_path,
      ARRAY[name]::varchar[] AS name_path
    FROM category_hierarchy
    WHERE id = category_id

    UNION ALL

    SELECT
      c.id,
      c.name,
      c.level,
      c.parent_id,
      (c.id   || ct.id_path)::uuid[],
      (c.name || ct.name_path)::varchar[]
    FROM category_hierarchy c
    JOIN category_tree ct ON c.id = ct.parent_id
  )
  SELECT
    UNNEST(id_path) AS path_id,
    UNNEST(name_path) AS path_name,
    UNNEST(ARRAY(SELECT generate_series(1, array_length(id_path, 1)))) AS path_level
  FROM category_tree
  ORDER BY path_level;
END;
$$ LANGUAGE plpgsql;
