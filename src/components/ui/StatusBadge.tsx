import type { OperationStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

const statusConfig: Record<OperationStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-zinc-700/50', text: 'text-zinc-300', dot: 'bg-zinc-400' },
  waiting: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
  ready: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  done: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  canceled: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

export function StatusBadge({ status }: { status: OperationStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
