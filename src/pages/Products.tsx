import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Search, Plus, Pencil, Check, X, Package } from 'lucide-react';
import type { Product, StockWithFree } from '@/lib/types';

export function Products() {
  const [stockItems, setStockItems] = useState<StockWithFree[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [tab, setTab] = useState<'stock' | 'products'>('stock');

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    unit_of_measure: 'unit',
    per_unit_cost: '0',
    reorder_min_qty: '0',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [stockRes, prodRes] = await Promise.all([
      supabase.from('stock_with_free').select('*').order('product_name'),
      supabase.from('products').select('*').order('name'),
    ]);
    setStockItems((stockRes.data ?? []) as StockWithFree[]);
    setProducts((prodRes.data ?? []) as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStock = stockItems.filter(
    (s) =>
      s.product_name.toLowerCase().includes(search.toLowerCase()) ||
      s.product_sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  async function saveEdit(stockId: string) {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) return;
    const { error } = await supabase.rpc('update_stock_manual', {
      p_stock_id: stockId,
      p_new_qty: qty,
    });
    if (error) {
      alert('Failed to update stock: ' + error.message);
      return;
    }
    setEditingId(null);
    loadData();
  }

  async function createProduct() {
    if (!newProduct.name || !newProduct.sku) {
      alert('Name and SKU are required');
      return;
    }
    const { error } = await supabase.from('products').insert({
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      unit_of_measure: newProduct.unit_of_measure,
      per_unit_cost: parseFloat(newProduct.per_unit_cost) || 0,
      reorder_min_qty: parseInt(newProduct.reorder_min_qty, 10) || 0,
    });
    if (error) {
      alert('Failed to create product: ' + error.message);
      return;
    }
    setNewProduct({
      name: '',
      sku: '',
      category: '',
      unit_of_measure: 'unit',
      per_unit_cost: '0',
      reorder_min_qty: '0',
    });
    setShowProductModal(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Products & Stock</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your product catalog and inventory levels</p>
        </div>
        <Button onClick={() => setShowProductModal(true)}>
          <Plus size={18} />
          New Product
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        <TabButton active={tab === 'stock'} onClick={() => setTab('stock')}>
          Stock Levels
        </TabButton>
        <TabButton active={tab === 'products'} onClick={() => setTab('products')}>
          Product Catalog
        </TabButton>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-zinc-50 placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : tab === 'stock' ? (
        <StockTable
          items={filteredStock}
          editingId={editingId}
          editQty={editQty}
          onEdit={(item) => {
            setEditingId(item.id);
            setEditQty(String(item.on_hand_qty));
          }}
          onQtyChange={setEditQty}
          onSave={saveEdit}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <ProductTable products={filteredProducts} />
      )}

      {/* New Product Modal */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="New Product"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancel
            </Button>
            <Button onClick={createProduct}>Create Product</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Wireless Mouse" />
          </div>
          <Input label="SKU / Code" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="SKU-007" />
          <Input label="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="Electronics" />
          <Input label="Unit of Measure" value={newProduct.unit_of_measure} onChange={(e) => setNewProduct({ ...newProduct, unit_of_measure: e.target.value })} />
          <Input label="Per Unit Cost" type="number" value={newProduct.per_unit_cost} onChange={(e) => setNewProduct({ ...newProduct, per_unit_cost: e.target.value })} />
          <Input label="Reorder Min Qty" type="number" value={newProduct.reorder_min_qty} onChange={(e) => setNewProduct({ ...newProduct, reorder_min_qty: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

function StockTable({
  items,
  editingId,
  editQty,
  onEdit,
  onQtyChange,
  onSave,
  onCancel,
}: {
  items: StockWithFree[];
  editingId: string | null;
  editQty: string;
  onEdit: (item: StockWithFree) => void;
  onQtyChange: (val: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}) {
  if (items.length === 0) {
    return <EmptyState message="No stock items found. Add products and create receipts to build inventory." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
            <th className="px-5 py-3 font-semibold text-zinc-400">Product</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">SKU</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Location</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Per Unit Cost</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">On Hand</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Free to Use</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {items.map((item) => {
            const isLow = item.on_hand_qty <= item.product_reorder_min;
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="transition-colors hover:bg-zinc-800/60/50">
                <td className="px-5 py-3.5 font-medium text-zinc-50">{item.product_name}</td>
                <td className="px-5 py-3.5 text-zinc-500">{item.product_sku}</td>
                <td className="px-5 py-3.5 text-zinc-500">
                  {item.location_name} <span className="text-zinc-500">({item.warehouse_code})</span>
                </td>
                <td className="px-5 py-3.5 text-zinc-500">${item.product_cost.toFixed(2)}</td>
                <td className="px-5 py-3.5">
                  {isEditing ? (
                    <input
                      type="number"
                      autoFocus
                      value={editQty}
                      onChange={(e) => onQtyChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSave(item.id);
                        if (e.key === 'Escape') onCancel();
                      }}
                      className="w-20 rounded border border-blue-400 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  ) : (
                    <span className={`font-semibold ${isLow ? 'text-red-400' : 'text-zinc-50'}`}>
                      {item.on_hand_qty}
                      {isLow && <span className="ml-1.5 text-xs font-normal text-red-500">low</span>}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={item.free_to_use_qty < 0 ? 'text-red-400 font-semibold' : 'text-zinc-300'}>
                    {item.free_to_use_qty}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => onSave(item.id)} className="rounded p-1 text-emerald-400 hover:bg-emerald-500/15">
                        <Check size={18} />
                      </button>
                      <button onClick={onCancel} className="rounded p-1 text-zinc-500 hover:bg-zinc-800">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-blue-400">
                      <Pencil size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <EmptyState message="No products yet. Click 'New Product' to add one." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
            <th className="px-5 py-3 font-semibold text-zinc-400">Name</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">SKU</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Category</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">UoM</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Cost</th>
            <th className="px-5 py-3 font-semibold text-zinc-400">Reorder Min</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {products.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-zinc-800/60/50">
              <td className="px-5 py-3.5 font-medium text-zinc-50">{p.name}</td>
              <td className="px-5 py-3.5 text-zinc-500">{p.sku}</td>
              <td className="px-5 py-3.5 text-zinc-500">{p.category || '—'}</td>
              <td className="px-5 py-3.5 text-zinc-500">{p.unit_of_measure}</td>
              <td className="px-5 py-3.5 text-zinc-500">${p.per_unit_cost.toFixed(2)}</td>
              <td className="px-5 py-3.5 text-zinc-500">{p.reorder_min_qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/90 py-16">
      <Package size={40} className="mb-3 text-zinc-600" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
