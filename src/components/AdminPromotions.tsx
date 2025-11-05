import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import * as Icons from 'lucide-react';
import { createPromotion, deletePromotion, getPromotions, updatePromotion, Promotion, getServiceItems, ServiceItem } from '../services/contentService';
import { withTimeout } from '../api/supa';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface AdminPromotionsProps {
  onClose: () => void;
}

const emptyPromotion = (): Pick<Promotion, 'title' | 'description' | 'price' | 'order_index'> => ({
  title: '',
  description: '',
  price: '',
  order_index: 0,
});

const AdminPromotions: React.FC<AdminPromotionsProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceItemsError, setServiceItemsError] = useState<string | null>(null);
  const [serviceItemsLoading, setServiceItemsLoading] = useState(true);

  // Charge les promotions avec timeout et ne bloque pas l'UI sur les prestations
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const promos = await withTimeout(getPromotions(), 8000);
      setItems(promos as Promotion[]);
    } catch (e) {
      // Fallback REST direct (bypass client) en cas de timeout ou d'erreur
      try {
        const base = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_SUPABASE_URL as string | undefined;
        const anon = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;
        if (!base || !anon) throw new Error('Config Supabase manquante');
        const url = `${base}/rest/v1/promotions?select=*`;
        const { data: s } = await supabase.auth.getSession();
        const token = s?.session?.access_token || anon;
        const res = await withTimeout(fetch(url, { headers: { 'apikey': anon, 'Authorization': `Bearer ${token}` } }), 8000);
        if (!res.ok) throw new Error(`REST ${res.status}`);
        const json = await res.json();
        const sorted = Array.isArray(json) ? [...json].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) : [];
        setItems(sorted as Promotion[]);
      } catch (e2) {
        const msg = (e as { message?: string })?.message || (e2 as { message?: string })?.message || 'Erreur lors du chargement des promotions';
        setError(msg);
        setItems([]);
      }
    } finally { setLoading(false); }

    // Charger les prestations liées en parallèle, sans bloquer
    setServiceItemsLoading(true);
    setServiceItemsError(null);
    try {
      const sis = await withTimeout(getServiceItems(), 8000);
      setServiceItems(sis as ServiceItem[]);
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Erreur lors du chargement des prestations';
      setServiceItemsError(msg);
      setServiceItems([]);
    } finally {
      setServiceItemsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await createPromotion(emptyPromotion());
      setItems(prev => [created as Promotion, ...prev]);
      setError(null);
      showToast('Promotion créée.', 'success');
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Erreur lors de la création';
      showToast(msg, 'error');
    } finally { setCreating(false); }
  };

  const handleSave = async (p: Promotion) => {
    setSavingId(p.id);
    try {
      const updates: Partial<Promotion> = {
        title: (p.title || '').trim(),
        description: (p.description || '').trim(),
        price: (p.price || '').trim(),
        order_index: p.order_index ?? 0,
        service_item_ids: p.service_item_ids ?? null,
        original_price: (p.original_price ?? '') === '' ? null : (p.original_price as string),
        badge: (p.badge ?? '') === '' ? null : (p.badge as string),
        icon: (p.icon ?? '') === '' ? null : (p.icon as string),
      };
      const res = await updatePromotion(p.id, updates);
      setItems(prev => prev.map(i => i.id === p.id ? (res as Promotion) : i));
      setError(null);
      showToast('Promotion enregistrée.', 'success');
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Erreur lors de l’enregistrement';
      showToast(msg, 'error');
    } finally { setSavingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette promotion ?')) return;
    try {
      await deletePromotion(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setError(null);
      showToast('Promotion supprimée.', 'success');
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Erreur lors de la suppression';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-start sm:items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-harmonie-200">
          <h4 className="font-display text-lg font-bold text-harmonie-800">Promotions</h4>
          <button aria-label="Fermer" onClick={onClose} className="p-2 text-harmonie-500 hover:text-harmonie-700 hover:bg-harmonie-50 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-3 py-1.5 bg-harmonie-600 text-white rounded hover:bg-harmonie-700 disabled:opacity-50">
              <Plus size={16} /> Nouvelle promotion
            </button>
          </div>
          {loading ? (
            <div className="text-sm text-harmonie-600">Chargement…</div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="border border-harmonie-200 rounded-lg p-3 bg-harmonie-50">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs text-harmonie-600">Titre
                      <input value={p.title || ''} onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, title: e.target.value } : i))} className="mt-1 w-full px-2 py-1 border rounded" />
                    </label>
                    <label className="text-xs text-harmonie-600">Description
                      <textarea value={p.description || ''} onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, description: e.target.value } : i))} className="mt-1 w-full px-2 py-1 border rounded" />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-harmonie-600">Prix
                        <input value={p.price || ''} onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, price: e.target.value } : i))} className="mt-1 w-full px-2 py-1 border rounded" />
                      </label>
                      <label className="text-xs text-harmonie-600">Ordre
                        <input type="number" value={p.order_index ?? 0} onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, order_index: Number(e.target.value) } : i))} className="mt-1 w-full px-2 py-1 border rounded" />
                      </label>
                    </div>
                      {/* Prix barré + Badge */}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-harmonie-600">Prix barré (optionnel)
                          <input
                            placeholder="ex: 120€"
                            value={p.original_price || ''}
                            onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, original_price: e.target.value } : i))}
                            className="mt-1 w-full px-2 py-1 border rounded"
                          />
                        </label>
                        <label className="text-xs text-harmonie-600">Badge (optionnel)
                          <input
                            placeholder="ex: Premium, Limité, Nouveau"
                            value={p.badge || ''}
                            onChange={e => setItems(prev => prev.map(i => i.id === p.id ? { ...i, badge: e.target.value } : i))}
                            className="mt-1 w-full px-2 py-1 border rounded"
                          />
                        </label>
                      </div>
                      {/* Icône (picker visuel) */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="text-xs font-semibold text-harmonie-700">Icône</div>
                        {(() => {
                          const available: string[] = ['Sparkles','Gift','Crown','Star','Wand2','Diamond','Heart','BadgePercent'];
                          const SelectedIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[p.icon || 'Sparkles'];
                          return (
                            <>
                              <div className="grid grid-cols-8 gap-2">
                                {available.map(name => {
                                  const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
                                  const isSelected = (p.icon || 'Sparkles') === name;
                                  return (
                                    <button
                                      key={name}
                                      type="button"
                                      title={name}
                                      onClick={() => setItems(prev => prev.map(i => i.id === p.id ? { ...i, icon: name } : i))}
                                      className={`p-2 border rounded-lg flex items-center justify-center hover:border-harmonie-400 transition-colors ${isSelected ? 'bg-harmonie-100 border-harmonie-500' : 'border-harmonie-200'}`}
                                    >
                                      {IconComp ? <IconComp className="w-5 h-5 text-harmonie-700" /> : <span className="text-[10px]">{name}</span>}
                                    </button>
                                  );
                                })}
                                {/* Bouton Par défaut */}
                                <button
                                  type="button"
                                  onClick={() => setItems(prev => prev.map(i => i.id === p.id ? { ...i, icon: null as unknown as string } : i))}
                                  className={`p-2 border rounded-lg text-[10px] ${!p.icon ? 'bg-harmonie-100 border-harmonie-500' : 'border-harmonie-200 hover:border-harmonie-400'}`}
                                  title="Par défaut (Sparkles)"
                                >
                                  Def.
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-harmonie-600">Aperçu:</span>
                                {SelectedIcon ? <SelectedIcon className="w-4 h-4 text-harmonie-700" /> : <Icons.Sparkles className="w-4 h-4 text-harmonie-700" />}
                                <span className="text-[10px] text-harmonie-500">(icône utilisée si vous n’en saisissez pas d’autre)</span>
                              </div>
                              {/* Entrée personnalisée retirée sur demande */}
                            </>
                          );
                        })()}
                      </div>
                    {/* Liaison aux prestations (service_items) */}
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-harmonie-700 mb-1">Prestations liées</div>
                      <div className="max-h-40 overflow-auto border border-harmonie-200 rounded p-2 bg-white">
                        {serviceItemsLoading ? (
                          <div className="text-xs text-harmonie-500">Chargement des prestations…</div>
                        ) : serviceItemsError ? (
                          <div className="text-xs text-red-600">{serviceItemsError}</div>
                        ) : serviceItems.length === 0 ? (
                          <div className="text-xs text-harmonie-500">Aucune prestation trouvée.</div>
                        ) : (
                          <div className="grid grid-cols-1 gap-1">
                            {serviceItems.map(si => {
                              const selected = (p.service_item_ids || []).includes(si.id);
                              return (
                                <label key={si.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => setItems(prev => prev.map(i => {
                                      if (i.id !== p.id) return i;
                                      const current = new Set(i.service_item_ids || []);
                                      if (e.target.checked) current.add(si.id);
                                      else current.delete(si.id);
                                      return { ...i, service_item_ids: Array.from(current) } as Promotion;
                                    }))}
                                  />
                                  <span className="truncate">{si.label} ({si.price} · {si.duration_minutes ?? si.duration ?? '?'} min)</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded flex items-center gap-1">
                      <Trash2 size={16} /> Supprimer
                    </button>
                    <button onClick={() => handleSave(p)} disabled={savingId === p.id} className="px-3 py-1.5 bg-harmonie-600 text-white rounded hover:bg-harmonie-700 disabled:opacity-50 flex items-center gap-1">
                      <Save size={16} /> Enregistrer
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-harmonie-600">Aucune promotion pour l’instant.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;