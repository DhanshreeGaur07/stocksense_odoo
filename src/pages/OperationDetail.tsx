import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLeft, CheckCircle2, XCircle, Printer, Plus, Trash2, AlertTriangle, Check } from 'lucide-react';
import type { Operation, OperationLine, Product, Location, Profile, OperationType, OperationStatus } from '@/lib/types';
import { OPERATION_LABELS, STATUS_LABELS, STATUS_ORDER } from '@/lib/types';

export function OperationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [op, setOp] = useState<Operation | null>(null);
  const [lines, setLines] = useState<OperationLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [contact, setContact] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [responsible, setResponsible] = useState('');
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editQtyVal, setEditQtyVal] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [opRes, linesRes, prodRes, locRes, profileRes] = await Promise.all([
      supabase.from('operations').select('*').eq('id', id).maybeSingle(),
      supabase.from('operation_lines').select('*').eq('operation_id', id),
      supabase.from('products').select('*').order('name'),
      supabase.from('locations').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    const operation = opRes.data as Operation | null;
    setOp(operation);
    setLines((linesRes.data ?? []) as OperationLine[]);
    setProducts((prodRes.data ?? []) as Product[]);
    setLocations((locRes.data ?? []) as Location[]);
    setProfiles((profileRes.data ?? []) as Profile[]);
    setContact(operation?.contact || '');
    setScheduledDate(operation?.scheduled_date || '');
    setResponsible(operation?.responsible_user_id || profile?.id || '');

    // Load stock for out-of-stock detection (deliveries/transfers)
    if (operation && operation.source_location_id) {
      const { data: stockData } = await supabase
        .from('stock')
        .select('product_id, on_hand_qty, reserved_qty')
        .eq('location_id', operation.source_location_id);
      const map: Record<string, number> = {};
      for (const s of (stockData ?? []) as { product_id: string; on_hand_qty: number; reserved_qty: number }[]) {
        map[s.product_id] = s.on_hand_qty - s.reserved_qty;
      }
      setStockMap(map);
    }
    setLoading(false);
  }, [id, profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleValidate() {
    if (!op) return;
    setValidating(true);
    const { error } = await supabase.rpc('validate_operation', { p_op_id: op.id });
    if (error) {
      alert('Validation failed: ' + error.message);
      setValidating(false);
      return;
    }
    await loadData();
    setValidating(false);
  }

  async function handleCancel() {
    if (!op) return;
    const { error } = await supabase.from('operations').update({ status: 'canceled' }).eq('id', op.id);
    if (error) {
      alert('Failed to cancel: ' + error.message);
      return;
    }
    loadData();
  }

  async function handleSaveDetails() {
    if (!op) return;
    const { error } = await supabase
      .from('operations')
      .update({
        contact,
        scheduled_date: scheduledDate || null,
        responsible_user_id: responsible || null,
      })
      .eq('id', op.id);
    if (error) {
      alert('Failed to save: ' + error.message);
      return;
    }
    loadData();
  }

  async function addLine() {
    if (!op || !newProductId) return;
    const { error } = await supabase.from('operation_lines').insert({
      operation_id: op.id,
      product_id: newProductId,
      quantity: parseInt(newQty, 10) || 1,
    });
    if (error) {
      alert('Failed to add line: ' + error.message);
      return;
    }
    setNewProductId('');
    setNewQty('1');
    loadData();
  }

  async function removeLine(lineId: string) {
    const { error } = await supabase.from('operation_lines').delete().eq('id', lineId);
    if (error) {
      alert('Failed to remove: ' + error.message);
      return;
    }
    loadData();
  }

  async function saveLineQty(lineId: string) {
    const qty = parseInt(editQtyVal, 10);
    if (isNaN(qty) || qty < 0) return;
    const { error } = await supabase.from('operation_lines').update({ quantity: qty }).eq('id', lineId);
    if (error) {
      alert('Failed to update: ' + error.message);
      return;
    }
    setEditingLine(null);
    loadData();
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!op) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-zinc-500">Operation not found.</p>
        <Link to="/operations" className="mt-4 text-blue-400 hover:text-blue-400">Back to Operations</Link>
      </div>
    );
  }

  const sourceLoc = locations.find((l) => l.id === op.source_location_id);
  const destLoc = locations.find((l) => l.id === op.destination_location_id);
  const isReadOnly = op.status === 'done' || op.status === 'canceled';
  const hasStockIssue = op.type === 'delivery' && lines.some((l) => (stockMap[l.product_id] ?? 0) < l.quantity);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/operations" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
        <ArrowLeft size={16} />
        Back to Operations
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{op.reference}</h1>
            <StatusBadge status={op.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">{OPERATION_LABELS[op.type]} operation</p>
        </div>
        <div className="flex gap-2.5">
          {op.status !== 'done' && op.status !== 'canceled' && (
            <>
              <Button variant="success" onClick={handleValidate} disabled={validating}>
                <CheckCircle2 size={18} />
                {validating ? 'Validating...' : 'Validate'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <XCircle size={18} />
                Cancel
              </Button>
            </>
          )}
          {op.status === 'done' && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={18} />
              Print
            </Button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <StatusStepper type={op.type} status={op.status} />

      {/* Out of stock alert */}
      {hasStockIssue && op.status !== 'done' && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={18} />
          Some products are out of stock. This delivery will move to "Waiting" status when validated.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-sm shadow-black/20">
            <h3 className="mb-4 text-sm font-semibold text-zinc-50">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  {op.type === 'receipt' ? 'Receive From' : op.type === 'delivery' ? 'Delivery Address' : 'Contact'}
                </label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">From Location</label>
                <p className="rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">{sourceLoc?.name || '—'}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">To Location</label>
                <p className="rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">{destLoc?.name || '—'}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Schedule Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Responsible</label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || 'Unknown'}</option>
                  ))}
                </select>
              </div>
              {!isReadOnly && (
                <Button variant="outline" size="sm" className="w-full" onClick={handleSaveDetails}>
                  Save Details
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product lines */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
            <div className="border-b border-zinc-800/80 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-50">Products</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
                  <th className="px-5 py-3 font-semibold text-zinc-400">Product</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">SKU</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">Quantity</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">Available</th>
                  {!isReadOnly && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 4 : 5} className="px-5 py-8 text-center text-zinc-500">
                      No products added yet.
                    </td>
                  </tr>
                )}
                {lines.map((line) => {
                  const product = products.find((p) => p.id === line.product_id);
                  const available = stockMap[line.product_id] ?? null;
                  const isOutOfStock = op.type === 'delivery' && available !== null && available < line.quantity;
                  const isEditing = editingLine === line.id;
                  return (
                    <tr
                      key={line.id}
                      className={`transition-colors ${isOutOfStock ? 'bg-red-500/10' : 'hover:bg-zinc-800/60/50'}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-zinc-50">{product?.name || 'Unknown'}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{product?.sku || '—'}</td>
                      <td className="px-5 py-3.5">
                        {isEditing && !isReadOnly ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              autoFocus
                              value={editQtyVal}
                              onChange={(e) => setEditQtyVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveLineQty(line.id);
                                if (e.key === 'Escape') setEditingLine(null);
                              }}
                              className="w-20 rounded border border-blue-400 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <button onClick={() => saveLineQty(line.id)} className="text-emerald-400 hover:bg-emerald-500/15 rounded p-1">
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`cursor-pointer font-semibold ${isOutOfStock ? 'text-red-400' : 'text-zinc-50'}`}
                            onClick={() => {
                              if (!isReadOnly) {
                                setEditingLine(line.id);
                                setEditQtyVal(String(line.quantity));
                              }
                            }}
                          >
                            {line.quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {available !== null ? (
                          <span className={isOutOfStock ? 'font-semibold text-red-400' : 'text-zinc-500'}>
                            {available}
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="px-5 py-3.5">
                          <button onClick={() => removeLine(line.id)} className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Add new line */}
            {!isReadOnly && (
              <div className="flex items-center gap-2 border-t border-zinc-800/80 px-5 py-3">
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select product to add...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-24 rounded-lg border border-zinc-700 px-3 py-2 text-sm focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <Button size="sm" onClick={addLine} disabled={!newProductId}>
                  <Plus size={16} />
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print-only summary */}
      <div className="hidden print:block">
        <PrintSummary op={op} lines={lines} products={products} sourceLoc={sourceLoc} destLoc={destLoc} />
      </div>
    </div>
  );
}

function StatusStepper({ type, status }: { type: OperationType; status: OperationStatus }) {
  let steps: OperationStatus[];
  if (type === 'receipt') steps = ['draft', 'ready', 'done'];
  else if (type === 'delivery') steps = ['draft', 'waiting', 'ready', 'done'];
  else if (type === 'internal_transfer') steps = ['draft', 'ready', 'done'];
  else steps = ['draft', 'done'];

  if (status === 'canceled') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-400">
        This operation has been canceled
      </div>
    );
  }

  const currentIdx = steps.indexOf(status);
  if (currentIdx === -1 && status === 'done') {
    // done is always last
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIdx || status === 'done';
        const isCurrent = idx === currentIdx && status !== 'done';
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isComplete
                    ? 'bg-emerald-500/150 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-zinc-500'
                }`}
              >
                {isComplete ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span className={`text-xs font-medium ${isCurrent ? 'text-blue-400' : isComplete ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 rounded ${idx < currentIdx || status === 'done' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrintSummary({
  op,
  lines,
  products,
  sourceLoc,
  destLoc,
}: {
  op: Operation;
  lines: OperationLine[];
  products: Product[];
  sourceLoc?: Location;
  destLoc?: Location;
}) {
  return (
    <div className="mt-8 border-t-2 border-zinc-700 pt-6">
      <h2 className="text-xl font-bold">{OPERATION_LABELS[op.type]} — {op.reference}</h2>
      <p className="text-sm text-zinc-400">Status: {STATUS_LABELS[op.status]}</p>
      <p className="text-sm text-zinc-400">Date: {op.scheduled_date || 'N/A'}</p>
      <p className="text-sm text-zinc-400">Contact: {op.contact || 'N/A'}</p>
      <p className="text-sm text-zinc-400">From: {sourceLoc?.name || 'N/A'}</p>
      <p className="text-sm text-zinc-400">To: {destLoc?.name || 'N/A'}</p>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="py-2 text-left">Product</th>
            <th className="py-2 text-left">SKU</th>
            <th className="py-2 text-right">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const product = products.find((p) => p.id === line.product_id);
            return (
              <tr key={line.id} className="border-b border-zinc-800/80">
                <td className="py-2">{product?.name || 'Unknown'}</td>
                <td className="py-2">{product?.sku || '—'}</td>
                <td className="py-2 text-right">{line.quantity}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
