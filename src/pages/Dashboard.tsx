import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  PackagePlus,
  PackageMinus,
  Clock,
  AlertTriangle,
  Boxes,
  TrendingDown,
  ArrowLeftRight,
} from 'lucide-react';
import type { Operation } from '@/lib/types';

interface DashboardData {
  receiptsToReceive: number;
  receiptsLate: number;
  receiptsTotal: number;
  deliveriesToDeliver: number;
  deliveriesLate: number;
  deliveriesWaiting: number;
  deliveriesTotal: number;
  totalProductsInStock: number;
  lowStockItems: number;
  transfersScheduled: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];

      const { data: receipts, error: e1 } = await supabase
        .from('operations')
        .select('*')
        .eq('type', 'receipt')
        .neq('status', 'done')
        .neq('status', 'canceled');

      const { data: deliveries, error: e2 } = await supabase
        .from('operations')
        .select('*')
        .eq('type', 'delivery')
        .neq('status', 'done')
        .neq('status', 'canceled');

      const { data: transfers, error: e3 } = await supabase
        .from('operations')
        .select('*')
        .eq('type', 'internal_transfer')
        .neq('status', 'done')
        .neq('status', 'canceled');

      const { data: stockItems, error: e4 } = await supabase.from('stock_with_free').select('*');

      const err = e1 || e2 || e3 || e4;
      if (err) {
        setDbError(err.message);
        setLoading(false);
        return;
      }

      const opsReceipts = (receipts ?? []) as Operation[];
      const opsDeliveries = (deliveries ?? []) as Operation[];

      const lateReceipts = opsReceipts.filter((r) => r.scheduled_date && r.scheduled_date < today).length;
      const lateDeliveries = opsDeliveries.filter((d) => d.scheduled_date && d.scheduled_date < today).length;
      const waitingDeliveries = opsDeliveries.filter((d) => d.status === 'waiting').length;

      const totalProductsInStock = (stockItems ?? []).length;
      const lowStockItems = (stockItems ?? []).filter(
        (s: { on_hand_qty: number; product_reorder_min: number }) =>
          s.on_hand_qty <= s.product_reorder_min
      ).length;

      setData({
        receiptsToReceive: opsReceipts.filter((r) => r.status === 'ready' || r.status === 'draft').length,
        receiptsLate: lateReceipts,
        receiptsTotal: opsReceipts.length,
        deliveriesToDeliver: opsDeliveries.filter((d) => d.status === 'ready' || d.status === 'draft').length,
        deliveriesLate: lateDeliveries,
        deliveriesWaiting: waitingDeliveries,
        deliveriesTotal: opsDeliveries.length,
        totalProductsInStock,
        lowStockItems,
        transfersScheduled: (transfers ?? []).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="card border-red-500/30 p-6 text-red-400">
        <p className="font-medium">Could not load dashboard</p>
        <p className="mt-1 text-sm text-zinc-500">{dbError}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of your inventory operations</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Link
          to="/operations?type=receipt"
          className="card-hover animate-fade-in-up stagger-1 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-transform duration-300 group-hover:scale-110">
                <PackagePlus size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">Receipts</h2>
                <p className="text-sm text-zinc-500">Incoming stock operations</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-bold tabular-nums text-zinc-50">{data.receiptsToReceive}</span>
            <span className="mb-1.5 text-sm text-zinc-500">to receive</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
            <Stat
              label="Late"
              value={data.receiptsLate}
              icon={<AlertTriangle size={14} />}
              variant={data.receiptsLate > 0 ? 'danger' : 'default'}
            />
            <Stat label="Total" value={data.receiptsTotal} icon={<Clock size={14} />} />
            <Stat label="Operations" value={data.receiptsTotal - data.receiptsLate} icon={<Boxes size={14} />} />
          </div>
        </Link>

        <Link to="/operations?type=delivery" className="card-hover animate-fade-in-up stagger-2 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <PackageMinus size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">Deliveries</h2>
                <p className="text-sm text-zinc-500">Outgoing stock operations</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-bold tabular-nums text-zinc-50">{data.deliveriesToDeliver}</span>
            <span className="mb-1.5 text-sm text-zinc-500">to deliver</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
            <Stat
              label="Late"
              value={data.deliveriesLate}
              icon={<AlertTriangle size={14} />}
              variant={data.deliveriesLate > 0 ? 'danger' : 'default'}
            />
            <Stat
              label="Waiting"
              value={data.deliveriesWaiting}
              icon={<Clock size={14} />}
              variant={data.deliveriesWaiting > 0 ? 'warning' : 'default'}
            />
            <Stat label="Total" value={data.deliveriesTotal} icon={<Boxes size={14} />} />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MiniStat
          icon={<Boxes size={20} />}
          label="Products in Stock"
          value={data.totalProductsInStock}
          color="blue"
          delay="stagger-3"
        />
        <MiniStat
          icon={<TrendingDown size={20} />}
          label="Low / Out of Stock"
          value={data.lowStockItems}
          color={data.lowStockItems > 0 ? 'amber' : 'green'}
          delay="stagger-4"
        />
        <MiniStat
          icon={<ArrowLeftRight size={20} />}
          label="Transfers Scheduled"
          value={data.transfersScheduled}
          color="blue"
          delay="stagger-5"
        />
      </div>

      <div className="flex animate-fade-in-up gap-3 stagger-5">
        <Link to="/operations?type=receipt">
          <Button variant="primary">View Receipts</Button>
        </Link>
        <Link to="/operations?type=delivery">
          <Button variant="outline">View Deliveries</Button>
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const colorClass =
    variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-amber-400' : 'text-zinc-300';
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${colorClass}`}>{value}</div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'amber' | 'green';
  delay?: string;
}) {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-400',
    amber: 'bg-amber-500/15 text-amber-400',
    green: 'bg-emerald-500/15 text-emerald-400',
  };
  return (
    <div className={`card-hover animate-fade-in-up flex items-center gap-4 p-5 ${delay ?? ''}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-zinc-50">{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
