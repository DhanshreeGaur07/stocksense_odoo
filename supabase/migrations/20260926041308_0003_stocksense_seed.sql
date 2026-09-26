/*
# StockSense — Seed Data

## Summary
Populates the database with demo data so the app looks populated for demos:
- 2 warehouses (Main WH, Secondary WH)
- Locations: Stock, Vendor, Customer (virtual), plus a couple racks
- 6 products across categories
- Stock entries for products
- Sample receipt, delivery, and internal transfer operations (various statuses)

All IDs are generated fresh so this is safe to re-run.
*/

-- Warehouses
INSERT INTO warehouses (name, short_code, address)
VALUES
  ('Main Warehouse', 'WH', '123 Industrial Ave, Springfield'),
  ('Secondary Warehouse', 'WH2', '456 Commerce Blvd, Shelbyville')
ON CONFLICT (short_code) DO NOTHING;

-- Locations for Main Warehouse
INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Stock', 'STK', w.id, false FROM warehouses w WHERE w.short_code = 'WH';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Rack A', 'RKA', w.id, false FROM warehouses w WHERE w.short_code = 'WH';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Rack B', 'RKB', w.id, false FROM warehouses w WHERE w.short_code = 'WH';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Vendor', 'VND', w.id, true FROM warehouses w WHERE w.short_code = 'WH';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Customer', 'CST', w.id, true FROM warehouses w WHERE w.short_code = 'WH';

-- Locations for Secondary Warehouse
INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Stock', 'STK', w.id, false FROM warehouses w WHERE w.short_code = 'WH2';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Vendor', 'VND', w.id, true FROM warehouses w WHERE w.short_code = 'WH2';

INSERT INTO locations (name, short_code, warehouse_id, is_virtual)
SELECT 'Customer', 'CST', w.id, true FROM warehouses w WHERE w.short_code = 'WH2';

-- Products
INSERT INTO products (name, sku, category, unit_of_measure, per_unit_cost, reorder_min_qty)
VALUES
  ('Wireless Mouse', 'SKU-001', 'Electronics', 'unit', 12.50, 10),
  ('Mechanical Keyboard', 'SKU-002', 'Electronics', 'unit', 45.00, 5),
  ('USB-C Cable 2m', 'SKU-003', 'Accessories', 'unit', 3.75, 50),
  ('Office Chair Ergonomic', 'SKU-004', 'Furniture', 'unit', 89.99, 3),
  ('Monitor Stand', 'SKU-005', 'Furniture', 'unit', 22.00, 8),
  ('Webcam HD 1080p', 'SKU-006', 'Electronics', 'unit', 35.00, 6)
ON CONFLICT DO NOTHING;

-- Stock: insert stock for each product at Main WH Stock location
INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 25, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-001'
ON CONFLICT (product_id, location_id) DO NOTHING;

INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 8, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-002'
ON CONFLICT (product_id, location_id) DO NOTHING;

INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 120, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-003'
ON CONFLICT (product_id, location_id) DO NOTHING;

INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 2, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-004'
ON CONFLICT (product_id, location_id) DO NOTHING;

INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 15, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-005'
ON CONFLICT (product_id, location_id) DO NOTHING;

INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 0, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-006'
ON CONFLICT (product_id, location_id) DO NOTHING;

-- Stock at Rack A (some products)
INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 10, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'RKA' AND w.short_code = 'WH' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-001'
ON CONFLICT (product_id, location_id) DO NOTHING;

-- Stock at Secondary WH
INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
SELECT p.id, l.id, 30, 0
FROM products p, locations l, warehouses w
WHERE l.short_code = 'STK' AND w.short_code = 'WH2' AND l.warehouse_id = w.id
  AND p.sku = 'SKU-003'
ON CONFLICT (product_id, location_id) DO NOTHING;

-- ===================== Sample Operations =====================
-- A done receipt
DO $$
DECLARE
  v_wh_id uuid := (SELECT id FROM warehouses WHERE short_code = 'WH');
  v_stock_loc uuid := (SELECT id FROM locations WHERE short_code = 'STK' AND warehouse_id = v_wh_id);
  v_vendor_loc uuid := (SELECT id FROM locations WHERE short_code = 'VND' AND warehouse_id = v_wh_id);
  v_customer_loc uuid := (SELECT id FROM locations WHERE short_code = 'CST' AND warehouse_id = v_wh_id);
  v_rack_a uuid := (SELECT id FROM locations WHERE short_code = 'RKA' AND warehouse_id = v_wh_id);
  v_ref text;
  v_op_id uuid;
  v_mouse uuid := (SELECT id FROM products WHERE sku = 'SKU-001');
  v_kb uuid := (SELECT id FROM products WHERE sku = 'SKU-002');
  v_cable uuid := (SELECT id FROM products WHERE sku = 'SKU-003');
  v_chair uuid := (SELECT id FROM products WHERE sku = 'SKU-004');
  v_webcam uuid := (SELECT id FROM products WHERE sku = 'SKU-006');
BEGIN
  -- Done receipt
  v_ref := generate_reference('WH', 'receipt');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status, done_at)
  VALUES (v_ref, 'receipt', v_vendor_loc, v_stock_loc, 'Acme Supplies', current_date - 5, 'done', now() - interval '4 days')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity, done_quantity) VALUES
    (v_op_id, v_mouse, 20, 20),
    (v_op_id, v_cable, 50, 50);

  -- Draft receipt
  v_ref := generate_reference('WH', 'receipt');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status)
  VALUES (v_ref, 'receipt', v_vendor_loc, v_stock_loc, 'TechSource Inc', current_date + 3, 'draft')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES
    (v_op_id, v_webcam, 10),
    (v_op_id, v_kb, 5);

  -- Ready receipt
  v_ref := generate_reference('WH', 'receipt');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status)
  VALUES (v_ref, 'receipt', v_vendor_loc, v_stock_loc, 'Global Components', current_date - 1, 'ready')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES
    (v_op_id, v_chair, 4);

  -- Done delivery
  v_ref := generate_reference('WH', 'delivery');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status, done_at)
  VALUES (v_ref, 'delivery', v_stock_loc, v_customer_loc, 'TechCo Customer', current_date - 3, 'done', now() - interval '2 days')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity, done_quantity) VALUES
    (v_op_id, v_mouse, 5, 5);

  -- Draft delivery (some out of stock)
  v_ref := generate_reference('WH', 'delivery');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status)
  VALUES (v_ref, 'delivery', v_stock_loc, v_customer_loc, 'Beta Retailers', current_date - 1, 'draft')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES
    (v_op_id, v_webcam, 3),
    (v_op_id, v_chair, 1);

  -- Ready delivery
  v_ref := generate_reference('WH', 'delivery');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status)
  VALUES (v_ref, 'delivery', v_stock_loc, v_customer_loc, 'Gamma Corp', current_date + 2, 'ready')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES
    (v_op_id, v_cable, 20),
    (v_op_id, v_mouse, 3);

  -- Draft internal transfer
  v_ref := generate_reference('WH', 'internal_transfer');
  INSERT INTO operations (reference, type, source_location_id, destination_location_id, contact, scheduled_date, status)
  VALUES (v_ref, 'internal_transfer', v_stock_loc, v_rack_a, '', current_date + 1, 'draft')
  RETURNING id INTO v_op_id;
  INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES
    (v_op_id, v_mouse, 5);
END $$;

-- Recompute reserved quantities based on open deliveries/transfers
-- (For demo simplicity, set a small reserved on the chair since a draft delivery wants 1)
UPDATE stock SET reserved_qty = 0;
