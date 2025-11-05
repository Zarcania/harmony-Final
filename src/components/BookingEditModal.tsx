import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, Tag } from 'lucide-react';
import { Booking } from '../types/booking';
import { format } from 'date-fns';
import { useAdmin } from '../contexts/AdminContext';
import { getPromotions, getServiceItems, Promotion, ServiceItem } from '../services/contentService';
import { useBooking } from '../contexts/BookingContext';

interface BookingEditModalProps {
  booking?: Booking;
  selectedDate?: string;
  onClose: () => void;
  // Accepte désormais le même shape que la réservation publique (avec serviceIds pour calculer la durée)
  onSave: (booking: {
    service: string;
    serviceIds?: string[];
    date: string;
    time: string;
    clientFirstName: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
  }) => Promise<void>;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ booking, selectedDate, onClose, onSave }) => {
  // Verrouille le scroll de fond pendant l’ouverture
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  const [formData, setFormData] = useState({
    date: booking?.date || selectedDate || format(new Date(), 'yyyy-MM-dd'),
    time: booking?.time || '09:00',
    service: booking?.service || '',
    serviceIds: [] as string[],
    clientFirstName: booking?.clientFirstName || '',
    clientName: booking?.clientName || '',
    clientPhone: booking?.clientPhone || '',
    clientEmail: booking?.clientEmail || '',
    status: (booking?.status || 'confirmed') as 'confirmed' | 'pending' | 'cancelled'
  });

  // Créneaux réellement disponibles (remplace la grille statique) côté admin
  const { getAvailableSlots, filterSlotsBySchedule, businessHours } = useBooking();
  const [slots, setSlots] = useState<string[]>([]);

  const { serviceSections, reloadServices, isAdmin } = useAdmin();
  React.useEffect(() => { reloadServices(); }, [reloadServices]);
  // Helpers durée
  const parseDurMin = (raw?: string | null) => {
    if (!raw) return 60;
    const s = String(raw).toLowerCase().replace(/\s+/g, '');
    const m1 = s.match(/^(\d+)h(?:(\d{1,2}))?$/);
    if (m1) {
      const h = parseInt(m1[1], 10);
      const mm = m1[2] ? parseInt(m1[2], 10) : 0;
      return h * 60 + mm;
    }
    const m2 = s.match(/^(\d+)(?:min|m)$/);
    if (m2) return parseInt(m2[1], 10);
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : 60;
  };

  // Aplatissement pour retrouver prix/durée
  const allItems = useMemo(() => serviceSections.flatMap(s => s.items.map(it => ({ ...it, section: s.title }))), [serviceSections]);
  const selectedItems = useMemo(() => allItems.filter(it => formData.serviceIds.includes(it.id)), [allItems, formData.serviceIds]);
  // Durée pour affichage: 0 si aucune prestation sélectionnée
  const totalDurationMin = useMemo(() => selectedItems.reduce((acc, it) => acc + parseDurMin(it.duration), 0), [selectedItems]);
  // Durée minimale technique pour la recherche de créneaux (évite 0 minute)
  const totalDurationForSlots = Math.max(totalDurationMin || 0, 60);

  const [showPicker, setShowPicker] = useState(false);

  // Promotions + items: pour proposer une section "Promotions" dans le picker
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [allServiceItems, setAllServiceItems] = useState<ServiceItem[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const [promos, items] = await Promise.all([
          getPromotions(),
          getServiceItems(),
        ]);
        setPromotions(promos as Promotion[]);
        setAllServiceItems(items as ServiceItem[]);
      } catch (e) {
        // Non bloquant pour l'admin
        console.warn('[Admin Booking] promotions/items load failed', e);
      }
    };
    load();
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service || !formData.clientFirstName || !formData.clientName || !formData.clientPhone || !formData.clientEmail) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'SLOT_OVERLAP') {
        alert('Ce créneau est déjà occupé pour la durée sélectionnée. Merci d\'en choisir un autre.');
      } else {
        alert((err as { message?: string })?.message || 'Erreur lors de la création du rendez-vous');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleService = (id: string) => {
    // Permet le toggle d'un item ou d'une promotion (id spécial "promo:<id>")
    if (id.startsWith('promo:')) {
      const promoId = id.slice('promo:'.length);
      const promo = promotions.find(p => p.id === promoId);
      const linked = new Set((promo?.service_item_ids || []) as string[]);
      setFormData(prev => {
        const cur = new Set(prev.serviceIds);
        const hasAll = Array.from(linked).every(x => cur.has(x));
        if (hasAll) {
          // Désélectionner tous les items liés
          for (const x of linked) cur.delete(x);
        } else {
          // Sélectionner/ajouter tous les items liés
          for (const x of linked) cur.add(x);
        }
        const ids = Array.from(cur);
        const labels = allItems.filter(it => ids.includes(it.id)).map(it => it.label).join(' + ');
        return { ...prev, serviceIds: ids, service: labels };
      });
      return;
    }
    setFormData(prev => {
      const next = new Set(prev.serviceIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      const ids = Array.from(next);
      const labels = allItems.filter(it => ids.includes(it.id)).map(it => it.label).join(' + ');
      return { ...prev, serviceIds: ids, service: labels };
    });
  };

  // Met à jour les slots disponibles selon la date sélectionnée et la durée totale
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!formData.date) { setSlots([]); return; }
      try {
        const sid = formData.serviceIds && formData.serviceIds.length ? formData.serviceIds : undefined;
        let list = await getAvailableSlots(formData.date, sid, totalDurationMin);
  if (!list || list.length === 0) {
          // Fallback horaire local si indispo backend temporaire
          const base = (() => {
            // Récupère les horaires configurés pour ce jour
            const dateObj = new Date(formData.date);
            const dow = (dateObj.getDay() + 6) % 7; // JS: 0=dim → DB: 0=lun
            const bh = businessHours.find(b => b.day_of_week === dow);
            const startTime = bh?.open_time || '09:00';
            const endTime = bh?.close_time || '18:00';
            
            const out: string[] = [];
            let d = new Date(`${formData.date}T${startTime}:00`);
            const end = new Date(`${formData.date}T${endTime}:00`);
            while (d < end) {
              out.push(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
              d = new Date(d.getTime() + 30*60*1000);
            }
            return out;
          })();
          const filtered = filterSlotsBySchedule(new Date(formData.date), base);
          const usable = (filtered && filtered.length > 0) ? filtered : base;
          const today = new Date().toISOString().slice(0,10);
          const nowStr = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/[^\d]/g, '').replace(/(\d{2})(\d{2})/, '$1:$2');
          list = (isAdmin || formData.date !== today) ? usable : usable.filter(t => t > nowStr);
        }
        if (!cancelled) setSlots(list);
      } catch (e) {
        console.warn('[Admin Booking] getAvailableSlots failed, fallback schedule-only', e);
        const base = (() => {
          // Récupère les horaires configurés pour ce jour
          const dateObj = new Date(formData.date);
          const dow = (dateObj.getDay() + 6) % 7; // JS: 0=dim → DB: 0=lun
          const bh = businessHours.find(b => b.day_of_week === dow);
          const startTime = bh?.open_time || '09:00';
          const endTime = bh?.close_time || '18:00';
          
          const out: string[] = [];
          let d = new Date(`${formData.date}T${startTime}:00`);
          const end = new Date(`${formData.date}T${endTime}:00`);
          while (d < end) {
            out.push(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
            d = new Date(d.getTime() + 30*60*1000);
          }
          return out;
        })();
        const filtered = filterSlotsBySchedule(new Date(formData.date), base);
        const usable = (filtered && filtered.length > 0) ? filtered : base;
        const today = new Date().toISOString().slice(0,10);
        const nowStr = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/[^\d]/g, '').replace(/(\d{2})(\d{2})/, '$1:$2');
        const list = (isAdmin || formData.date !== today) ? usable : usable.filter(t => t > nowStr);
        if (!cancelled) setSlots(list);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [formData.date, formData.serviceIds, getAvailableSlots, filterSlotsBySchedule, totalDurationForSlots, totalDurationMin, isAdmin, businessHours]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6 md:p-8 pt-[env(safe-area-inset-top)]">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-harmonie-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-600 text-white rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-xl font-bold text-harmonie-800">
              {booking ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le modal"
            title="Fermer"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="booking-date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="booking-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Heure * {selectedItems.length > 0 && (
                    <span className="text-xs text-harmonie-600 ml-2">(durée totale ~ {Math.floor(totalDurationMin/60)}h{String(totalDurationMin%60).padStart(2,'0')})</span>
                  )}
                </label>
                <select
                  id="booking-time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                >
                  {slots.length === 0 ? (
                    <option value="" disabled>Aucun créneau</option>
                  ) : (
                    slots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline-block w-4 h-4 mr-1" />
                Prestations *
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                aria-label="Ouvrir la sélection de prestation"
              >
                {formData.service || 'Sélectionnez une ou plusieurs prestations'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="client-first-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  id="client-first-name"
                  type="text"
                  name="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={handleChange}
                  required
                  placeholder="Prénom du client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="client-last-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  id="client-last-name"
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  placeholder="Nom du client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                id="client-phone"
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                required
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="client-email"
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                required
                placeholder="client@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="booking-status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                id="booking-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              >
                <option value="confirmed">Confirmé</option>
                <option value="pending">En attente</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {booking ? 'Enregistrer les modifications' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <h4 className="font-semibold text-sm">Sélectionnez une ou plusieurs prestations</h4>
              <button
                onClick={() => setShowPicker(false)}
                aria-label="Fermer la sélection"
                title="Fermer"
                className="p-1.5 text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
            {/* Section Promotions (si disponible) */}
            {promotions.length > 0 && (
              <div className="mb-3 border border-harmonie-200 rounded-lg overflow-hidden">
                <div className="w-full flex items-center justify-between px-3 py-2 bg-harmonie-50 text-sm font-semibold text-harmonie-700">
                  <span>Promotions</span>
                </div>
                <div className="p-2 grid gap-2">
                  {promotions.map((p) => {
                    const linked = new Set(p.service_item_ids || []);
                    const linkedIds = Array.from(linked);
                    const allSelected = linkedIds.length > 0 && linkedIds.every(id => formData.serviceIds.includes(id));
                    const dur = Array.from(linked).reduce((acc, id) => {
                      const it = allServiceItems.find(si => si.id === id);
                      const txt = it?.duration || (it?.duration_minutes ? `${it.duration_minutes}min` : undefined);
                      const s = (txt || '').toLowerCase().replace(/\s+/g, '');
                      const m1 = s.match(/^(\d+)h(?:(\d{1,2}))?$/);
                      if (m1) return acc + (parseInt(m1[1], 10) * 60 + (m1[2] ? parseInt(m1[2], 10) : 0));
                      const m2 = s.match(/^(\d+)(?:min|m)$/);
                      if (m2) return acc + parseInt(m2[1], 10);
                      const n = parseInt(s, 10);
                      return acc + (Number.isFinite(n) && n > 0 ? n : 0);
                    }, 0);
                    return (
                      <label key={p.id} className={`p-2 rounded-lg border text-left text-sm ${allSelected ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-4 w-4 mt-0.5" checked={allSelected} onChange={() => toggleService(`promo:${p.id}`)} disabled={linkedIds.length === 0} title={linkedIds.length === 0 ? 'Cette promotion n\'a pas de prestations liées (configurez-les dans Admin > Promotions).' : undefined} />
                          <div className="flex-1">
                            <div className="font-medium text-harmonie-900">{p.title}</div>
                            <div className="text-xs text-harmonie-600">{linkedIds.length === 0 ? 'Aucune prestation liée' : (p.description || '—')}</div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <div className="font-semibold text-harmonie-900">{p.price}</div>
                            <div className="text-xs text-harmonie-600">{dur ? `${Math.floor(dur/60)}h${String(dur%60).padStart(2,'0')}` : '—'}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {serviceSections.map((section) => (
              <AdminSectionPicker
                key={section.id}
                section={section}
                selectedIds={formData.serviceIds}
                onToggle={toggleService}
              />
            ))}
            </div>
            <div className="px-3 py-2 border-t flex items-center justify-between text-xs">
              <div className="text-harmonie-700">Durée totale estimée</div>
              <div className="flex items-center gap-3">
                <div className="font-semibold text-harmonie-900">{Math.floor(totalDurationMin/60)}h{String(totalDurationMin%60).padStart(2,'0')}</div>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="ml-auto inline-flex items-center justify-center px-3 py-1.5 rounded bg-harmonie-600 text-white hover:bg-harmonie-700 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingEditModal;

// Sous-composant compact + catégories repliées par défaut pour l'admin
const AdminSectionPicker: React.FC<{
  section: { id: string; title: string; items: Array<{ id: string; label: string; duration?: string | null; description?: string | null }> };
  selectedIds: string[];
  onToggle: (id: string) => void;
}> = ({ section, selectedIds, onToggle }) => {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="mb-3 border border-harmonie-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-harmonie-50 text-sm font-semibold text-harmonie-700"
      >
        <span>{section.title}</span>
        <span className="text-harmonie-500">{collapsed ? '▸' : '▾'}</span>
      </button>
      {!collapsed && (
        <div className="p-2 grid gap-2">
          {section.items.map((it) => {
            const checked = selectedIds.includes(it.id);
            return (
              <label
                key={it.id}
                className={`p-2 rounded-lg border text-left text-sm ${checked ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'}`}
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 mt-0.5" checked={checked} onChange={() => onToggle(it.id)} />
                  <div className="flex-1">
                    <div className="font-medium text-harmonie-900">{it.label}</div>
                    <div className="text-xs text-harmonie-600">{it.duration || '—'}</div>
                    {it.description && <div className="text-xs text-harmonie-500 mt-0.5 line-clamp-2">{it.description}</div>}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
