import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Search, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { MoveHistoryEntry, OperationStatus } from '@/lib/types';

export function MoveHistory() {
  const [entries, setEntries] = useState<MoveHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OperationStatus | 'all'>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('move_history')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) {
      console.error('Move history error:', error);
    }
    setEntries((data ?? []) as MoveHistoryEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.reference.toLowerCase().includes(search.toLowerCase()) ||
      e.contact.toLowerCase().includes(search.toLowerCase()) ||
      e.product_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Move History</h1>
        <p className="mt-1 text-sm text-zinc-500">Complete audit trail of all stock movements</p>
      </div>

      {/* Search + filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by reference, contact, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-zinc-50 placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OperationStatus | 'all')}
            className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 text-sm text-zinc-300 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanMoveView entries={filtered} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/90 py-16">
          <History size={40} className="mb-3 text-zinc-600" />
          <p className="text-sm text-zinc-500">No movements recorded yet.</p>
          <p className="mt-1 text-xs text-zinc-500">Validate operations to generate stock movements.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
                <th className="px-5 py-3 font-semibold text-zinc-400">Reference</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Date</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Product</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Contact</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">From</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">To</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Qty</th>
                <th className="px-5 py-3 font-semibold text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((entry) => {
                const isInbound = entry.direction === 'in';
                return (
                  <tr key={entry.line_id} className="transition-colors hover:bg-zinc-800/60/50">
                    <td className="px-5 py-3.5">
                      <Link to={`/operations/${entry.reference.includes('/') ? '' : ''}`} className="font-semibold text-zinc-50 hover:text-blue-400" onClick={(e) => e.preventDefault()}>
                        {entry.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {entry.done_at ? new Date(entry.done_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-300">{entry.product_name}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{entry.contact || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{entry.from_name || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{entry.to_name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-semibold ${isInbound ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isInbound ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        {entry.quantity_delta}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KanbanMoveView({ entries }: { entries: MoveHistoryEntry[] }) {
  const columns: OperationStatus[] = ['draft', 'waiting', 'ready', 'done', 'canceled'];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {columns.map((col) => {
        const items = entries.filter((e) => e.status === col);
        return (
          <div key={col} className="rounded-xl bg-zinc-800/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <StatusBadge status={col} />
              <span className="text-xs font-medium text-zinc-500">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-700 px-3 py-6 text-center text-xs text-zinc-500">
                  No items
                </div>
              )}
              {items.map((entry) => (
                <div
                  key={entry.line_id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-3.5 shadow-sm shadow-black/20"
                >
                  <p className="mb-1.5 text-sm font-semibold text-zinc-50">{entry.reference}</p>
                  <p className="mb-1 text-xs text-zinc-500">{entry.product_name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{entry.contact || '—'}</span>
                    <span className={`font-semibold ${entry.direction === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.direction === 'in' ? '+' : '-'}{entry.quantity_delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
