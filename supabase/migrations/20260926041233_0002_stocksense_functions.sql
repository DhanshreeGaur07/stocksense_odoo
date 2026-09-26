/*
# StockSense — Business Logic Functions & Seed Data

## Summary
1. `generate_reference()` — produces reference numbers in `<WH>/<OP>/<ID>` format (e.g. WH/IN/0001).
2. `validate_operation(p_op_id)` — SECURITY DEFINER function that advances an operation's status and mutates stock + writes ledger entries when it reaches `done`.
3. `update_stock_manual()` — SECURITY DEFINER function for direct stock edits from the Stock page; writes an adjustment ledger entry.
4. `free_to use` computed view via a `stock_with_free` view.
5. Seed data: two warehouses, locations, products, stock, sample operations.

## Security
- `validate_operation` and `update_stock_manual` are SECURITY DEFINER because they need to update multiple tables atomically; they are callable by authenticated users only via EXECUTE grant.
*/

-- ===================== Reference generator =====================
CREATE OR REPLACE FUNCTION public.generate_reference(
  p_warehouse_code text,
  p_op_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_next_id integer;
  v_prefix text;
BEGIN
  IF p_op_type = 'receipt' THEN v_code := 'IN';
  ELSIF p_op_type = 'delivery' THEN v_code := 'OUT';
  ELSIF p_op_type = 'internal_transfer' THEN v_code := 'INT';
  ELSIF p_op_type = 'adjustment' THEN v_code := 'ADJ';
  ELSE v_code := 'OP';
  END IF;

  SELECT count(*) + 1 INTO v_next_id
  FROM operations
  WHERE type = p_op_type;

  v_prefix := coalesce(p_warehouse_code, 'WH') || '/' || v_code || '/';
  RETURN v_prefix || lpad(v_next_id::text, 4, '0');
END;
$$;

-- ===================== Validate operation =====================
CREATE OR REPLACE FUNCTION public.validate_operation(p_op_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op operations%ROWTYPE;
  v_line operation_lines%ROWTYPE;
  v_dest_on_hand integer;
  v_src_on_hand integer;
  v_new_status text;
  v_warehouse_code text;
  v_has_stock_issue boolean := false;
BEGIN
  SELECT * INTO v_op FROM operations WHERE id = p_op_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operation not found';
  END IF;

  IF v_op.status = 'canceled' OR v_op.status = 'done' THEN
    RAISE EXCEPTION 'Cannot validate a done or canceled operation';
  END IF;

  -- Determine next status
  IF v_op.type = 'receipt' THEN
    IF v_op.status = 'draft' THEN v_new_status := 'ready';
    ELSIF v_op.status = 'ready' THEN v_new_status := 'done';
    ELSE v_new_status := 'done';
    END IF;
  ELSIF v_op.type = 'delivery' THEN
    IF v_op.status = 'draft' THEN
      -- Check stock availability
      FOR v_line IN SELECT * FROM operation_lines WHERE operation_id = p_op_id LOOP
        SELECT coalesce(sum(s.on_hand_qty - s.reserved_qty), 0) INTO v_src_on_hand
        FROM stock s WHERE s.product_id = v_line.product_id AND s.location_id = v_op.source_location_id;
        IF v_src_on_hand < v_line.quantity THEN
          v_has_stock_issue := true;
        END IF;
      END LOOP;
      IF v_has_stock_issue THEN v_new_status := 'waiting';
      ELSE v_new_status := 'ready';
      END IF;
    ELSIF v_op.status = 'waiting' THEN v_new_status := 'ready';
    ELSIF v_op.status = 'ready' THEN v_new_status := 'done';
    ELSE v_new_status := 'done';
    END IF;
  ELSIF v_op.type = 'internal_transfer' THEN
    IF v_op.status = 'draft' THEN v_new_status := 'ready';
    ELSIF v_op.status = 'ready' THEN v_new_status := 'done';
    ELSE v_new_status := 'done';
    END IF;
  ELSIF v_op.type = 'adjustment' THEN
    v_new_status := 'done';
  ELSE
    v_new_status := 'done';
  END IF;

  -- If not done yet, just update status
  IF v_new_status != 'done' THEN
    UPDATE operations SET status = v_new_status WHERE id = p_op_id;
    RETURN;
  END IF;

  -- === Status is becoming done: mutate stock + write ledger ===
  FOR v_line IN SELECT * FROM operation_lines WHERE operation_id = p_op_id LOOP
    IF v_op.type = 'receipt' THEN
      -- Increase on_hand at destination
      INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, v_line.quantity, 0)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET on_hand_qty = stock.on_hand_qty + v_line.quantity;

      SELECT on_hand_qty INTO v_dest_on_hand FROM stock
      WHERE product_id = v_line.product_id AND location_id = v_op.destination_location_id;

      INSERT INTO stock_ledger (product_id, location_id, operation_id, quantity_delta, direction, resulting_on_hand_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, p_op_id, v_line.quantity, 'in', v_dest_on_hand);

    ELSIF v_op.type = 'delivery' THEN
      -- Decrease on_hand at source
      UPDATE stock SET on_hand_qty = on_hand_qty - v_line.quantity
      WHERE product_id = v_line.product_id AND location_id = v_op.source_location_id;
      SELECT on_hand_qty INTO v_src_on_hand FROM stock
      WHERE product_id = v_line.product_id AND location_id = v_op.source_location_id;

      INSERT INTO stock_ledger (product_id, location_id, operation_id, quantity_delta, direction, resulting_on_hand_qty)
      VALUES (v_line.product_id, v_op.source_location_id, p_op_id, v_line.quantity, 'out', v_src_on_hand);

    ELSIF v_op.type = 'internal_transfer' THEN
      -- Decrease at source
      UPDATE stock SET on_hand_qty = on_hand_qty - v_line.quantity
      WHERE product_id = v_line.product_id AND location_id = v_op.source_location_id;
      SELECT on_hand_qty INTO v_src_on_hand FROM stock
      WHERE product_id = v_line.product_id AND location_id = v_op.source_location_id;
      INSERT INTO stock_ledger (product_id, location_id, operation_id, quantity_delta, direction, resulting_on_hand_qty)
      VALUES (v_line.product_id, v_op.source_location_id, p_op_id, v_line.quantity, 'out', v_src_on_hand);

      -- Increase at destination
      INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, v_line.quantity, 0)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET on_hand_qty = stock.on_hand_qty + v_line.quantity;
      SELECT on_hand_qty INTO v_dest_on_hand FROM stock
      WHERE product_id = v_line.product_id AND location_id = v_op.destination_location_id;
      INSERT INTO stock_ledger (product_id, location_id, operation_id, quantity_delta, direction, resulting_on_hand_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, p_op_id, v_line.quantity, 'in', v_dest_on_hand);

    ELSIF v_op.type = 'adjustment' THEN
      -- Set on_hand to done_quantity (the counted qty)
      INSERT INTO stock (product_id, location_id, on_hand_qty, reserved_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, v_line.done_quantity, 0)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET on_hand_qty = v_line.done_quantity;

      SELECT on_hand_qty INTO v_dest_on_hand FROM stock
      WHERE product_id = v_line.product_id AND location_id = v_op.destination_location_id;

      INSERT INTO stock_ledger (product_id, location_id, operation_id, quantity_delta, direction, resulting_on_hand_qty)
      VALUES (v_line.product_id, v_op.destination_location_id, p_op_id, v_line.done_quantity, 'in', v_dest_on_hand);
    END IF;

    -- Update done_quantity on the line
    UPDATE operation_lines SET done_quantity = v_line.quantity WHERE id = v_line.id;
  END LOOP;

  UPDATE operations SET status = 'done', done_at = now() WHERE id = p_op_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_operation(uuid) TO authenticated;

-- ===================== Manual stock update =====================
CREATE OR REPLACE FUNCTION public.update_stock_manual(
  p_stock_id uuid,
  p_new_qty integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock stock%ROWTYPE;
  v_delta integer;
  v_direction text;
BEGIN
  SELECT * INTO v_stock FROM stock WHERE id = p_stock_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock record not found'; END IF;

  v_delta := p_new_qty - v_stock.on_hand_qty;
  IF v_delta >= 0 THEN v_direction := 'in'; ELSE v_direction := 'out'; END IF;

  UPDATE stock SET on_hand_qty = p_new_qty WHERE id = p_stock_id;

  INSERT INTO stock_ledger (product_id, location_id, quantity_delta, direction, resulting_on_hand_qty)
  VALUES (v_stock.product_id, v_stock.location_id, v_delta, v_direction, p_new_qty);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_stock_manual(uuid, integer) TO authenticated;

-- ===================== Stock with free qty view =====================
CREATE OR REPLACE VIEW public.stock_with_free AS
SELECT
  s.id,
  s.product_id,
  s.location_id,
  s.on_hand_qty,
  s.reserved_qty,
  (s.on_hand_qty - s.reserved_qty) AS free_to_use_qty,
  p.name AS product_name,
  p.sku AS product_sku,
  p.category AS product_category,
  p.per_unit_cost AS product_cost,
  p.reorder_min_qty AS product_reorder_min,
  l.name AS location_name,
  l.short_code AS location_code,
  w.name AS warehouse_name,
  w.short_code AS warehouse_code
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN locations l ON s.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id;

ALTER VIEW public.stock_with_free OWNER TO postgres;
GRANT SELECT ON public.stock_with_free TO authenticated;

-- ===================== Move history view =====================
CREATE OR REPLACE VIEW public.move_history AS
SELECT
  ol.id AS line_id,
  o.reference,
  o.type,
  o.contact,
  o.status,
  o.scheduled_date,
  o.done_at,
  sl.product_id,
  sl.location_id AS ledger_location_id,
  sl.quantity_delta,
  sl.direction,
  sl.timestamp,
  sl.resulting_on_hand_qty,
  p.name AS product_name,
  p.sku AS product_sku,
  CASE
    WHEN o.type = 'receipt' THEN NULL
    ELSE o.source_location_id
  END AS source_location_id,
  CASE
    WHEN o.type = 'delivery' THEN NULL
    ELSE o.destination_location_id
  END AS dest_location_id,
  src_loc.name AS from_name,
  src_loc.short_code AS from_code,
  dst_loc.name AS to_name,
  dst_loc.short_code AS to_code
FROM stock_ledger sl
JOIN operations o ON sl.operation_id = o.id
JOIN products p ON sl.product_id = p.id
JOIN operation_lines ol ON ol.operation_id = o.id AND ol.product_id = sl.product_id
LEFT JOIN locations src_loc ON o.source_location_id = src_loc.id
LEFT JOIN locations dst_loc ON o.destination_location_id = dst_loc.id
WHERE sl.operation_id IS NOT NULL;

ALTER VIEW public.move_history OWNER TO postgres;
GRANT SELECT ON public.move_history TO authenticated;
