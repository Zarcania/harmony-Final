import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import { Promotion, getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../services/contentService';

interface PromotionEditorProps {
  onClose: () => void;
}

const PromotionEditor: React.FC<PromotionEditorProps> = ({ onClose }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gérer les Offres Exclusives</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <button
            onClick={() => setEditingPromo({ title: '', description: '', price: '', order_index: promotions.length })}
            className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter une promotion
          </button>

          {editingPromo && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h3 className="text-lg font-semibold mb-4">
                {editingPromo.id ? 'Modifier la promotion' : 'Nouvelle promotion'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={editingPromo.title || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Première visite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editingPromo.description || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Ex: Volume russe + Rehaussement pour les nouvelles clientes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix *
                  </label>
                  <input
                    type="text"
                    value={editingPromo.price || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 80€"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={editingPromo.order_index || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingPromo(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
                className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{promo.title}</h4>
                    <p className="text-gray-600 mb-2">{promo.description}</p>
                    <p className="text-xl font-bold text-blue-600">{promo.price}</p>
                    <p className="text-sm text-gray-500 mt-2">Ordre: {promo.order_index}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPromo(promo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
