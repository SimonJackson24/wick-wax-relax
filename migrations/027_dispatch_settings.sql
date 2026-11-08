-- Migration: 027_dispatch_settings.sql
-- Makes the PDP delivery-promise parameters admin-configurable instead
-- of code constants:
--   dispatch_cutoff_hour  — hour (0-23) after which orders count as
--                           "dispatched tomorrow" (default 14:00)
--   dispatch_sunday_delivery — whether the carrier delivers on Sundays
--                           (Royal Mail: false)
-- Both are read by the public /api/shipping/estimate endpoint and drive
-- the "Order within Xh Ym / arrives <date>" promise on the product page.

INSERT INTO platform_settings (id, category, key, value, description, validation_rules) VALUES
  ('ship-cutoff-hour', 'shipping', 'dispatch_cutoff_hour', '14',
   'Dispatch cut-off hour (24h clock). Orders placed after this time count towards the next working day. Drives the "Order within" promise on product pages.',
   '{"type": "integer", "minimum": 0, "maximum": 23}'),
  ('ship-sunday-delivery', 'shipping', 'dispatch_sunday_delivery', 'false',
   'Whether your carrier delivers on Sundays (Royal Mail does not). Controls how arrival dates are calculated on product pages.',
   '{"type": "boolean"}')
ON CONFLICT (id) DO NOTHING;
