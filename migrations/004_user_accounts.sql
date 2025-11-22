-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false
);

-- Create user addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('SHIPPING', 'BILLING')),
  full_name VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')) DEFAULT 'ACTIVE',
  next_order_date DATE NOT NULL,
  last_order_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- Create subscription orders
CREATE TABLE subscription_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_product ON user_subscriptions(product_id);
CREATE INDEX idx_subscription_orders_subscription ON subscription_orders(subscription_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, interval, discount_percentage) VALUES
('Weekly Wellness', 'Weekly delivery of your favorite scent', 'WEEKLY', 5.00),
('Bi-Weekly Balance', 'Every other week delivery for consistent relaxation', 'BIWEEKLY', 7.50),
('Monthly Renewal', 'Monthly delivery with best value', 'MONTHLY', 10.00);