/*
# StockSense — Core Schema

## Summary
Creates the complete inventory management system schema: profiles, warehouses, locations, products, stock, operations, operation lines, and the stock ledger. Enables RLS on every table with authenticated-only, owner-aware policies.

## New Tables
1. `profiles` — extends auth.users with name and role (admin/manager/staff).
2. `warehouses` — name, unique short_code, address.
3. `locations` — sub-locations within a warehouse (racks, rooms, virtual vendor/customer locations).
4. `products` — name, sku, category, unit_of_measure, per_unit_cost, reorder_min_qty.
5. `stock` — on-hand and reserved quantities per product per location.
6. `operations` — covers receipts, deliveries, internal transfers, adjustments via a `type` enum. Has reference, status, source/destination locations, contact, responsible user, scheduled date.
7. `operation_lines` — line items per operation (product + quantity + done_quantity).
8. `stock_ledger` — immutable audit log of every stock-affecting event.

## Security
- RLS enabled on all tables.
- `profiles`: user can read/update own row; anyone authenticated can read all profiles (for responsible-user dropdowns).
- All other tables: authenticated users get full CRUD (shared inventory workspace — all authenticated users see all inventory data).
- No `user_id` ownership columns on inventory tables because inventory is shared across the organization, not per-user isolated.
*/

-- ===================== profiles =====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','manager','staff')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===================== warehouses =====================
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text NOT NULL UNIQUE,
  address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wh_select" ON warehouses;
CREATE POLICY "wh_select" ON warehouses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "wh_insert" ON warehouses;
CREATE POLICY "wh_insert" ON warehouses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "wh_update" ON warehouses;
CREATE POLICY "wh_update" ON warehouses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "wh_delete" ON warehouses;
CREATE POLICY "wh_delete" ON warehouses FOR DELETE TO authenticated USING (true);

-- ===================== locations =====================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  is_virtual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, short_code)
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loc_select" ON locations;
CREATE POLICY "loc_select" ON locations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "loc_insert" ON locations;
CREATE POLICY "loc_insert" ON locations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "loc_update" ON locations;
CREATE POLICY "loc_update" ON locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "loc_delete" ON locations;
CREATE POLICY "loc_delete" ON locations FOR DELETE TO authenticated USING (true);

-- ===================== products =====================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL,
  category text DEFAULT '',
  unit_of_measure text NOT NULL DEFAULT 'unit',
  per_unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  reorder_min_qty integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prod_select" ON products;
CREATE POLICY "prod_select" ON products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "prod_insert" ON products;
CREATE POLICY "prod_insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "prod_update" ON products;
CREATE POLICY "prod_update" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "prod_delete" ON products;
CREATE POLICY "prod_delete" ON products FOR DELETE TO authenticated USING (true);

-- ===================== stock =====================
CREATE TABLE IF NOT EXISTS stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  on_hand_qty integer NOT NULL DEFAULT 0,
  reserved_qty integer NOT NULL DEFAULT 0,
  UNIQUE(product_id, location_id)
);

ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stk_select" ON stock;
CREATE POLICY "stk_select" ON stock FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "stk_insert" ON stock;
CREATE POLICY "stk_insert" ON stock FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "stk_update" ON stock;
CREATE POLICY "stk_update" ON stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "stk_delete" ON stock;
CREATE POLICY "stk_delete" ON stock FOR DELETE TO authenticated USING (true);

-- ===================== operations =====================
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('receipt','delivery','internal_transfer','adjustment')),
  source_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  destination_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  contact text DEFAULT '',
  responsible_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','waiting','ready','done','canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz
);

ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "op_select" ON operations;
CREATE POLICY "op_select" ON operations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "op_insert" ON operations;
CREATE POLICY "op_insert" ON operations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "op_update" ON operations;
CREATE POLICY "op_update" ON operations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "op_delete" ON operations;
CREATE POLICY "op_delete" ON operations FOR DELETE TO authenticated USING (true);

-- ===================== operation_lines =====================
CREATE TABLE IF NOT EXISTS operation_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  done_quantity integer NOT NULL DEFAULT 0
);

ALTER TABLE operation_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ol_select" ON operation_lines;
CREATE POLICY "ol_select" ON operation_lines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ol_insert" ON operation_lines;
CREATE POLICY "ol_insert" ON operation_lines FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ol_update" ON operation_lines;
CREATE POLICY "ol_update" ON operation_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ol_delete" ON operation_lines;
CREATE POLICY "ol_delete" ON operation_lines FOR DELETE TO authenticated USING (true);

-- ===================== stock_ledger =====================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES operations(id) ON DELETE SET NULL,
  quantity_delta integer NOT NULL DEFAULT 0,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  resulting_on_hand_qty integer NOT NULL DEFAULT 0,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sl_select" ON stock_ledger;
CREATE POLICY "sl_select" ON stock_ledger FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "sl_insert" ON stock_ledger;
CREATE POLICY "sl_insert" ON stock_ledger FOR INSERT TO authenticated WITH CHECK (true);

-- ===================== Indexes =====================
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(type);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_op_lines_op ON operation_lines(operation_id);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_location ON stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_op ON stock_ledger(operation_id);

-- ===================== profile auto-create trigger =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'staff')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
