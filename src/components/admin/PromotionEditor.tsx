import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Gift } from 'lucide-react';
import { Promotion, getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../services/contentService';
import { useAdmin } from '../../contexts/AdminContext';

interface PromotionEditorProps {
  onClose: () => void;
}

const PromotionEditor: React.FC<PromotionEditorProps> = ({ onClose }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { serviceSections } = useAdmin();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const defaultPromotions: Omit<Promotion, 'id'>[] = [
    { title: 'Première visite', description: 'Volume russe + Rehaussement', price: '80€', original_price: '115€', badge: 'Nouveau', icon: 'Sparkles', order_index: 0 },
    { title: 'Pack Beauté', description: 'Sourcils + Extensions', price: '65€', original_price: '90€', badge: 'Populaire', icon: 'Heart', order_index: 1 },
    { title: 'Premium', description: 'Volume russe + Soins', price: '95€', original_price: '120€', badge: 'Premium', icon: 'Crown', order_index: 2 },
    { title: 'Duo Complice', description: 'Pour vous et votre amie', price: '99€', original_price: '140€', badge: 'Limité', icon: 'Gift', order_index: 3 },
  ];

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
      alert('Erreur lors du chargement des promotions');
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const existing = promotions.map((p) => p.title.toLowerCase());
      const toCreate = defaultPromotions.filter((p) => !existing.includes(p.title.toLowerCase()));
      if (toCreate.length === 0) {
        alert('Les promotions par défaut sont déjà présentes.');
        return;
      }
      for (const promo of toCreate) {
        await createPromotion(promo);
      }
      await loadPromotions();
    } catch (error) {
      console.error('Error seeding promotions:', error);
      alert('Erreur lors de l\'ajout des promotions par défaut');
    } finally {
      setSeeding(false);
    }
  };

  const toggleSection = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  useEffect(() => {
    // Fermer par défaut
    const init: Record<string, boolean> = {};
    for (const s of serviceSections) init[s.id] = true;
    setCollapsed(init);
  }, [serviceSections]);

  const handleSave = async () => {
    if (!editingPromo || !editingPromo.title || !editingPromo.description || !editingPromo.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (editingPromo.id) {
        await updatePromotion(editingPromo.id, editingPromo);
      } else {
        await createPromotion({
          title: editingPromo.title,
          description: editingPromo.description,
          price: editingPromo.price,
          original_price: editingPromo.original_price,
          badge: editingPromo.badge,
          icon: editingPromo.icon,
          order_index: editingPromo.order_index || 0,
        });
      }
      await loadPromotions();
      setEditingPromo(null);
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;

    setLoading(true);
    try {
      await deletePromotion(id);
      await loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top)]">
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 sm:px-6 py-4 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Gift size={20} />
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-harmonie-800">Gérer les Offres Exclusives</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(90vh-80px)]">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setEditingPromo({ title: '', description: '', price: '', order_index: promotions.length, service_item_ids: [] })}
              className="flex-1 sm:flex-none sm:w-auto bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white px-5 py-3 rounded-lg hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Ajouter une promotion
            </button>
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="flex-1 sm:flex-none sm:w-auto px-5 py-3 border border-harmonie-200 text-harmonie-700 rounded-lg hover:bg-harmonie-50 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Ajout…' : 'Remplir avec promos par défaut'}
            </button>
          </div>

          {editingPromo && (
            <div className="mb-6 p-6 bg-harmonie-50 rounded-xl border border-harmonie-200">
              <h3 className="text-lg font-semibold mb-4 text-harmonie-800">
                {editingPromo.id ? 'Modifier la promotion' : 'Nouvelle promotion'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="promo-title" className="block text-sm font-medium text-harmonie-700 mb-2">
                    Titre *
                  </label>
                  <input
                    id="promo-title"
                    type="text"
                    value={editingPromo.title || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                    className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                    placeholder="Ex: Première visite"
                  />
                </div>
                {/* Sélection des prestations liées */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-harmonie-700">
                      Prestations liées (facultatif)
                    </label>
                    {Array.isArray(editingPromo.service_item_ids) && editingPromo.service_item_ids.length > 0 && (
                      <span className="text-xs text-harmonie-600">
                        {editingPromo.service_item_ids.length} sélectionnée(s)
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    {serviceSections.map((section) => (
                      <div key={section.id} className="border border-harmonie-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-harmonie-700 bg-harmonie-50"
                        >
                          <span>{section.title}</span>
                          <span className="text-harmonie-500">{collapsed[section.id] ? '▸' : '▾'}</span>
                        </button>
                        {!collapsed[section.id] && (
                          <div className="p-2 grid gap-2">
                            {section.items.map((item) => {
                              const checked = (editingPromo.service_item_ids || []).includes(item.id);
                              return (
                                <label key={item.id} className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${checked ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'}`}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 mt-0.5"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = new Set(editingPromo.service_item_ids || []);
                                        if (e.target.checked) next.add(item.id); else next.delete(item.id);
                                        setEditingPromo({ ...editingPromo, service_item_ids: Array.from(next) });
                                      }}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-harmonie-900">{item.label}</div>
                                      <div className="text-xs text-harmonie-600">{item.description || '—'}</div>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                      <div className="font-semibold text-harmonie-900">{item.price}</div>
                                      <div className="text-xs text-harmonie-600">{item.duration || '—'}</div>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="promo-description" className="block text-sm font-medium text-harmonie-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="promo-description"
                    value={editingPromo.description || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                    className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                    rows={3}
                    placeholder="Ex: Volume russe + Rehaussement pour les nouvelles clientes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="promo-price" className="block text-sm font-medium text-harmonie-700 mb-2">
                      Prix *
                    </label>
                    <input
                      id="promo-price"
                      type="text"
                      value={editingPromo.price || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, price: e.target.value })}
                      className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                      placeholder="Ex: 80€"
                    />
                  </div>
                  <div>
                    <label htmlFor="promo-original-price" className="block text-sm font-medium text-harmonie-700 mb-2">
                      Prix barré
                    </label>
                    <input
                      id="promo-original-price"
                      type="text"
                      value={editingPromo.original_price || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, original_price: e.target.value })}
                      className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                      placeholder="Ex: 115€"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="promo-badge" className="block text-sm font-medium text-harmonie-700 mb-2">
                      Badge
                    </label>
                    <input
                      id="promo-badge"
                      type="text"
                      value={editingPromo.badge || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, badge: e.target.value })}
                      className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                      placeholder="Ex: Nouveau, Populaire"
                    />
                  </div>
                  <div>
                    <label htmlFor="promo-icon" className="block text-sm font-medium text-harmonie-700 mb-2">
                      Icône
                    </label>
                    <input
                      id="promo-icon"
                      type="text"
                      value={editingPromo.icon || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                      placeholder="Ex: Sparkles, Heart, Crown, Gift"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="promo-order" className="block text-sm font-medium text-harmonie-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    id="promo-order"
                    type="number"
                    value={editingPromo.order_index || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-harmonie-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-harmonie-600 text-white px-6 py-3 rounded-lg hover:bg-harmonie-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingPromo(null)}
                    className="px-6 py-3 border border-harmonie-200 text-harmonie-700 rounded-lg hover:bg-harmonie-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="p-6 bg-white border border-harmonie-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-harmonie-900">{promo.title}</h4>
                      {promo.badge && (
                        <span className="text-xs bg-harmonie-100 text-harmonie-700 px-2 py-1 rounded-full">
                          {promo.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-harmonie-700 mb-2">{promo.description}</p>
                    <div className="flex items-baseline gap-3">
                      {promo.original_price && (
                        <span className="text-sm text-harmonie-500 line-through">{promo.original_price}</span>
                      )}
                      <span className="text-2xl font-semibold text-harmonie-700">{promo.price}</span>
                    </div>
                    <p className="text-sm text-harmonie-500 mt-2">
                      Ordre: {promo.order_index} {promo.icon && `• Icône: ${promo.icon}`}
                    </p>
                    {Array.isArray(promo.service_item_ids) && promo.service_item_ids.length > 0 && (
                      <p className="text-sm text-harmonie-600 mt-1">
                        Prestations: {promo.service_item_ids.length}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPromo({ ...promo, service_item_ids: promo.service_item_ids || [] })}
                      className="p-2 text-harmonie-700 hover:bg-harmonie-50 rounded-lg transition-colors"
                      aria-label={`Modifier ${promo.title}`}
                      title={`Modifier ${promo.title}`}
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label={`Supprimer ${promo.title}`}
                      title={`Supprimer ${promo.title}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionEditor;
