import { useEffect, useState } from 'react';
import { Database, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkDbConnection, type DbConnectionStatus } from '@/lib/dbHealth';

export function DbStatus() {
  const [status, setStatus] = useState<DbConnectionStatus>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await checkDbConnection();
      if (cancelled) return;
      setStatus(result.status);
      setDetail(
        result.status === 'connected'
          ? `${result.warehouseCount ?? 0} warehouse(s) in database`
          : result.message
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const icon =
    status === 'checking' ? (
      <Loader2 size={14} className="animate-spin text-zinc-500" />
    ) : status === 'connected' ? (
      <CheckCircle2 size={14} className="text-emerald-400" />
    ) : (
      <AlertCircle size={14} className="text-red-400" />
    );

  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400 transition-colors lg:flex"
      title={detail}
    >
      <Database size={14} className="text-blue-400/80" />
      {icon}
      <span>
        {status === 'checking' && 'Checking database…'}
        {status === 'connected' && 'DB connected'}
        {status === 'error' && 'DB issue'}
      </span>
    </div>
  );
}
