import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, Building2, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import type { Warehouse, Location } from '@/lib/types';

export function Settings() {
  const [tab, setTab] = useState<'warehouses' | 'locations'>('warehouses');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Warehouse | Location | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [whRes, locRes] = await Promise.all([
      supabase.from('warehouses').select('*').order('name'),
      supabase.from('locations').select('*').order('name'),
    ]);
    setWarehouses((whRes.data ?? []) as Warehouse[]);
    setLocations((locRes.data ?? []) as Location[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form state
  const [whForm, setWhForm] = useState({ name: '', short_code: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', short_code: '', warehouse_id: '', is_virtual: false });

  function openNew() {
    setEditingItem(null);
    if (tab === 'warehouses') {
      setWhForm({ name: '', short_code: '', address: '' });
    } else {
      setLocForm({ name: '', short_code: '', warehouse_id: warehouses[0]?.id || '', is_virtual: false });
    }
    setShowModal(true);
  }

  function openEdit(item: Warehouse | Location) {
    setEditingItem(item);
    if (tab === 'warehouses') {
      const wh = item as Warehouse;
      setWhForm({ name: wh.name, short_code: wh.short_code, address: wh.address });
    } else {
      const loc = item as Location;
      setLocForm({ name: loc.name, short_code: loc.short_code, warehouse_id: loc.warehouse_id, is_virtual: loc.is_virtual });
    }
    setShowModal(true);
  }

  async function handleSave() {
    if (tab === 'warehouses') {
      if (!whForm.name || !whForm.short_code) {
        alert('Name and short code are required');
        return;
      }
      if (editingItem) {
        const { error } = await supabase
          .from('warehouses')
          .update({ name: whForm.name, short_code: whForm.short_code, address: whForm.address })
          .eq('id', (editingItem as Warehouse).id);
        if (error) {
          alert('Failed to update: ' + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('warehouses').insert(whForm);
        if (error) {
          alert('Failed to create: ' + error.message);
          return;
        }
      }
    } else {
      if (!locForm.name || !locForm.short_code || !locForm.warehouse_id) {
        alert('All fields are required');
        return;
      }
      if (editingItem) {
        const { error } = await supabase
          .from('locations')
          .update({
            name: locForm.name,
            short_code: locForm.short_code,
            warehouse_id: locForm.warehouse_id,
            is_virtual: locForm.is_virtual,
          })
          .eq('id', (editingItem as Location).id);
        if (error) {
          alert('Failed to update: ' + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('locations').insert(locForm);
        if (error) {
          alert('Failed to create: ' + error.message);
          return;
        }
      }
    }
    setShowModal(false);
    loadData();
  }

  async function handleDelete(item: Warehouse | Location) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (tab === 'warehouses') {
      const { error } = await supabase.from('warehouses').delete().eq('id', (item as Warehouse).id);
      if (error) {
        alert('Failed to delete: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('locations').delete().eq('id', (item as Location).id);
      if (error) {
        alert('Failed to delete: ' + error.message);
        return;
      }
    }
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage warehouses and locations</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={18} />
          New {tab === 'warehouses' ? 'Warehouse' : 'Location'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        <button
          onClick={() => setTab('warehouses')}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'warehouses' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Building2 size={16} />
          Warehouses
        </button>
        <button
          onClick={() => setTab('locations')}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'locations' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MapPin size={16} />
          Locations
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : tab === 'warehouses' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/90 py-16">
              <WarehouseIcon size={40} className="mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-500">No warehouses yet.</p>
            </div>
          )}
          {warehouses.map((wh) => (
            <div key={wh.id} className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-sm shadow-black/20 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                    <WarehouseIcon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-50">{wh.name}</h3>
                    <p className="text-xs text-zinc-500">Code: {wh.short_code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(wh)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-blue-400">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(wh)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {wh.address && <p className="mt-3 text-sm text-zinc-500">{wh.address}</p>}
              <p className="mt-2 text-xs text-zinc-500">
                {locations.filter((l) => l.warehouse_id === wh.id).length} locations
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm shadow-black/20">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MapPin size={40} className="mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-500">No locations yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50/50 text-left">
                  <th className="px-5 py-3 font-semibold text-zinc-400">Name</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">Short Code</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">Warehouse</th>
                  <th className="px-5 py-3 font-semibold text-zinc-400">Type</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {locations.map((loc) => {
                  const wh = warehouses.find((w) => w.id === loc.warehouse_id);
                  return (
                    <tr key={loc.id} className="transition-colors hover:bg-zinc-800/60/50">
                      <td className="px-5 py-3.5 font-medium text-zinc-50">{loc.name}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{loc.short_code}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{wh?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${loc.is_virtual ? 'bg-purple-50 text-purple-700' : 'bg-zinc-800 text-zinc-400'}`}>
                          {loc.is_virtual ? 'Virtual' : 'Physical'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(loc)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-blue-400">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(loc)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? `Edit ${tab === 'warehouses' ? 'Warehouse' : 'Location'}` : `New ${tab === 'warehouses' ? 'Warehouse' : 'Location'}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingItem ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        {tab === 'warehouses' ? (
          <div className="space-y-4">
            <Input label="Name" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} placeholder="Main Warehouse" />
            <Input label="Short Code" value={whForm.short_code} onChange={(e) => setWhForm({ ...whForm, short_code: e.target.value.toUpperCase() })} placeholder="WH" maxLength={5} />
            <Input label="Address" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} placeholder="123 Industrial Ave" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Name" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="Rack A" />
            <Input label="Short Code" value={locForm.short_code} onChange={(e) => setLocForm({ ...locForm, short_code: e.target.value.toUpperCase() })} placeholder="RKA" maxLength={5} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Warehouse</label>
              <select
                value={locForm.warehouse_id}
                onChange={(e) => setLocForm({ ...locForm, warehouse_id: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 px-3.5 py-2.5 text-sm focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={locForm.is_virtual}
                onChange={(e) => setLocForm({ ...locForm, is_virtual: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 text-blue-400 focus:ring-blue-500/40"
              />
              <span className="text-sm text-zinc-300">Virtual location (e.g. Vendor/Customer)</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
