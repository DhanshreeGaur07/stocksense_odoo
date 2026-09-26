export type OperationType = 'receipt' | 'delivery' | 'internal_transfer' | 'adjustment';
export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';
export type UserRole = 'admin' | 'manager' | 'staff';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  short_code: string;
  address: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  short_code: string;
  warehouse_id: string;
  is_virtual: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_of_measure: string;
  per_unit_cost: number;
  reorder_min_qty: number;
  created_at: string;
}

export interface Stock {
  id: string;
  product_id: string;
  location_id: string;
  on_hand_qty: number;
  reserved_qty: number;
}

export interface StockWithFree extends Stock {
  free_to_use_qty: number;
  product_name: string;
  product_sku: string;
  product_category: string;
  product_cost: number;
  product_reorder_min: number;
  location_name: string;
  location_code: string;
  warehouse_name: string;
  warehouse_code: string;
}

export interface Operation {
  id: string;
  reference: string;
  type: OperationType;
  source_location_id: string | null;
  destination_location_id: string | null;
  contact: string;
  responsible_user_id: string | null;
  scheduled_date: string | null;
  status: OperationStatus;
  created_at: string;
  done_at: string | null;
}

export interface OperationLine {
  id: string;
  operation_id: string;
  product_id: string;
  quantity: number;
  done_quantity: number;
}

export interface OperationWithDetails extends Operation {
  source_location?: Location | null;
  destination_location?: Location | null;
  responsible_user?: Profile | null;
  lines?: OperationLine[];
}

export interface MoveHistoryEntry {
  line_id: string;
  reference: string;
  type: OperationType;
  contact: string;
  status: OperationStatus;
  scheduled_date: string | null;
  done_at: string | null;
  product_id: string;
  quantity_delta: number;
  direction: 'in' | 'out';
  timestamp: string;
  resulting_on_hand_qty: number;
  product_name: string;
  product_sku: string;
  source_location_id: string | null;
  dest_location_id: string | null;
  from_name: string | null;
  from_code: string | null;
  to_name: string | null;
  to_code: string | null;
}

export const OPERATION_LABELS: Record<OperationType, string> = {
  receipt: 'Receipt',
  delivery: 'Delivery',
  internal_transfer: 'Internal Transfer',
  adjustment: 'Adjustment',
};

export const OPERATION_CODES: Record<OperationType, string> = {
  receipt: 'IN',
  delivery: 'OUT',
  internal_transfer: 'INT',
  adjustment: 'ADJ',
};

export const STATUS_ORDER: OperationStatus[] = ['draft', 'waiting', 'ready', 'done', 'canceled'];

export const STATUS_LABELS: Record<OperationStatus, string> = {
  draft: 'Draft',
  waiting: 'Waiting',
  ready: 'Ready',
  done: 'Done',
  canceled: 'Canceled',
};
