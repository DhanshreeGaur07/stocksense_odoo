import type { Operation, OperationType } from '@/lib/types';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface KanbanBoardProps {
  operations: Operation[];
  type?: OperationType;
}

const columns = ['draft', 'waiting', 'ready', 'done', 'canceled'] as const;

export function KanbanBoard({ operations }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {columns.map((col, colIndex) => {
        const items = operations.filter((op) => op.status === col);
        return (
          <div
            key={col}
            className="animate-fade-in-up rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3"
            style={{ animationDelay: `${colIndex * 0.06}s`, opacity: 0 }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <StatusBadge status={col} />
              <span className="text-xs font-medium text-zinc-500">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-700 px-3 py-6 text-center text-xs text-zinc-600">
                  No items
                </div>
              )}
              {items.map((op, i) => (
                <Link
                  key={op.id}
                  to={`/operations/${op.id}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-900/90 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-glow-sm"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <p className="mb-1.5 text-sm font-semibold text-zinc-100">{op.reference}</p>
                  <p className="mb-2 truncate text-xs text-zinc-500">{op.contact || '—'}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{op.scheduled_date || 'No date'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
