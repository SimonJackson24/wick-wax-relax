-- Migration: 025_product_qa.sql
-- Product Q&A (roadmap 1.63 — Amazon's "Customer questions & answers").
-- Customers ask; the owner/staff answer. Questions are visible as soon as
-- asked (public browsing value); answers appear once answered. The
-- answered flag + timestamps drive the PDP section and any future
-- "question asked" notification emails.

CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(100),
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answer TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_answers_question ON product_answers(question_id);
