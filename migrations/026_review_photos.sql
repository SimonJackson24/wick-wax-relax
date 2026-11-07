-- Migration: 026_review_photos.sql
-- Photo reviews (1.62): one customer-submitted photo per review, v1.
-- photo_url points at our own uploads/reviews/ storage (served under
-- /uploads) — never a third-party URL, so no external hotlinking or
-- moderation blind spots.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
