import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { Search, Plus, ChevronRight } from 'lucide-react';
import type { Operation, OperationType, Location, Profile } from '@/lib/types';
import { OPERATION_LABELS } from '@/lib/types';

export function OperationsList() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as OperationType) || 'receipt';
  const [operations, setOperations] = useState<Operation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [opsRes, locRes, prodRes, profileRes] = await Promise.all([
      supabase.from('operations').select('*').eq('type', type).order('created_at', { ascending: false }),
      supabase.from('locations').select('*'),
      supabase.from('products').select('id, name, sku'),
      supabase.from('profiles').select('*'),
    ]);
    setOperations((opsRes.data ?? []) as Operation[]);
    setLocations((locRes.data ?? []) as Location[]);
    setProducts((prodRes.data ?? []) as { id: string; name: string; sku: string }[]);
    setProfiles((profileRes.data ?? []) as Profile[]);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = operations.filter(
    (op) =>
      op.reference.toLowerCase().includes(search.toLowerCase()) ||
      op.contact.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = OPERATION_LABELS[type];

  const tabs: { key: OperationType; label: string }[] = [
    { key: 'receipt', label: 'Receipts' },
    { key: 'delivery', label: 'Deliveries' },
    { key: 'internal_transfer', label: 'Transfers' },
    { key: 'adjustment', label: 'Adjustments' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Operations</h1>
          <p className="mt-1 text-sm text-zinc-500">{typeLabel} operations</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} />
          New {typeLabel}
        </Button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {tabs.map((t) => (
          <Link
            key={t.key}
            to={`/operations?type=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              type === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by reference or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-zinc-50 placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard operations={filtered} type={type} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/90 py-16">
          <p className="text-sm text-zinc-500">No {typeLabel.toLowerCase()} operations found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
                <th className="px-5 py-3 font-semibold text-zinc-400">Reference</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">From</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">To</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Contact</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Schedule Date</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((op) => {
                const fromLoc = locations.find((l) => l.id === op.source_location_id);
                const toLoc = locations.find((l) => l.id === op.destination_location_id);
                return (
                  <tr key={op.id} className="transition-colors hover:bg-zinc-800/60/50">
                    <td className="px-5 py-3.5 font-semibold text-zinc-50">
                      <Link to={`/operations/${op.id}`} className="hover:text-blue-400">
                        {op.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{fromLoc?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{toLoc?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{op.contact || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{op.scheduled_date || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={op.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/operations/${op.id}`} className="text-zinc-500 hover:text-blue-400">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewOperationModal
          type={type}
          locations={locations}
          products={products}
          profiles={profiles}
          onClose={() => setShowModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}

function NewOperationModal({
  type,
  locations,
  products,
  profiles,
  onClose,
  onCreated,
}: {
  type: OperationType;
  locations: Location[];
  products: { id: string; name: string; sku: string }[];
  profiles: Profile[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuthSafe();
  const [contact, setContact] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sourceLoc, setSourceLoc] = useState('');
  const [destLoc, setDestLoc] = useState('');
  const [responsible, setResponsible] = useState(profile?.id || '');
  const [lines, setLines] = useState<{ product_id: string; quantity: string }[]>([{ product_id: '', quantity: '1' }]);
  const [saving, setSaving] = useState(false);

  // Auto-fill defaults
  useEffect(() => {
    if (type === 'receipt') {
      const vendor = locations.find((l) => l.short_code === 'VND');
      const stock = locations.find((l) => l.short_code === 'STK' && !l.is_virtual);
      if (vendor) setSourceLoc(vendor.id);
      if (stock) setDestLoc(stock.id);
    } else if (type === 'delivery') {
      const stock = locations.find((l) => l.short_code === 'STK' && !l.is_virtual);
      const customer = locations.find((l) => l.short_code === 'CST');
      if (stock) setSourceLoc(stock.id);
      if (customer) setDestLoc(customer.id);
    }
  }, [type, locations]);

  function addLine() {
    setLines([...lines, { product_id: '', quantity: '1' }]);
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: 'product_id' | 'quantity', value: string) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  async function handleCreate() {
    setSaving(true);
    try {
      // Get warehouse code for reference
      const destLocation = locations.find((l) => l.id === destLoc);
      const srcLoc = locations.find((l) => l.id === sourceLoc);
      const refLoc = destLocation || srcLoc;
      let whCode = 'WH';
      if (refLoc) {
        const { data: wh } = await supabase
          .from('warehouses')
          .select('short_code')
          .eq('id', refLoc.warehouse_id)
          .maybeSingle();
        if (wh) whCode = (wh as { short_code: string }).short_code;
      }

      const { data: refData, error: refError } = await supabase.rpc('generate_reference', {
        p_warehouse_code: whCode,
        p_op_type: type,
      });
      if (refError) throw refError;

      const reference = refData as string;

      const { data: opData, error: opError } = await supabase
        .from('operations')
        .insert({
          reference,
          type,
          source_location_id: sourceLoc || null,
          destination_location_id: destLoc || null,
          contact,
          responsible_user_id: responsible || null,
          scheduled_date: scheduledDate || null,
          status: 'draft',
        })
        .select()
        .single();

      if (opError) throw opError;

      const opId = (opData as Operation).id;
      const validLines = lines.filter((l) => l.product_id && parseInt(l.quantity) > 0);
      if (validLines.length > 0) {
        const { error: lineError } = await supabase.from('operation_lines').insert(
          validLines.map((l) => ({
            operation_id: opId,
            product_id: l.product_id,
            quantity: parseInt(l.quantity, 10),
          }))
        );
        if (lineError) throw lineError;
      }

      onCreated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create operation');
    } finally {
      setSaving(false);
    }
  }

  const isReceipt = type === 'receipt';
  const isDelivery = type === 'delivery';
  const isTransfer = type === 'internal_transfer';
  const isAdjustment = type === 'adjustment';

  const fieldClass =
    'w-full rounded-lg border border-zinc-700 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark]';
  const selectClass = `${fieldClass} appearance-none`;
  const fieldClassSm =
    'rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-black shadow-2xl shadow-black/50">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">New {OPERATION_LABELS[type]}</h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            {!isReceipt && !isAdjustment && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">From Location</label>
                <select value={sourceLoc} onChange={(e) => setSourceLoc(e.target.value)} className={selectClass}>
                  <option value="" className="bg-black text-white">
                    Select source...
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="bg-black text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!isDelivery && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">{isReceipt ? 'Receive To' : isAdjustment ? 'Location' : 'To Location'}</label>
                <select value={destLoc} onChange={(e) => setDestLoc(e.target.value)} className={selectClass}>
                  <option value="" className="bg-black text-white">
                    Select destination...
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="bg-black text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!isTransfer && (
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">{isReceipt ? 'Receive From' : isDelivery ? 'Delivery Address' : 'Contact'}</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Vendor or customer name"
                  className={fieldClass}
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Schedule Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Responsible</label>
              <select value={responsible} onChange={(e) => setResponsible(e.target.value)} className={selectClass}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-black text-white">
                    {p.name || p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product lines */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Products</span>
              <button onClick={addLine} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-400">
                <Plus size={16} /> Add product
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                    className={`${fieldClassSm} flex-1`}
                  >
                    <option value="" className="bg-black text-white">
                      Select product...
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-black text-white">
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                    className={`${fieldClassSm} w-24`}
                  />
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-500">
                      <Plus size={16} className="rotate-45" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '@/lib/auth';
function useAuthSafe() {
  return useAuth();
}
