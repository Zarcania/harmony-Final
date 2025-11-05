import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Upload, Eye, EyeOff } from 'lucide-react';
import { PortfolioItem, getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem, uploadImage, getPortfolioCategories, createPortfolioCategory, updatePortfolioCategory, deletePortfolioCategory } from '../../services/contentService';
import CategoryManager from './CategoryManager';

interface Category {
  id: string;
  name: string;
  order_index: number;
}

interface PortfolioEditorProps {
  onClose: () => void;
}

const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ onClose }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getPortfolioItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading portfolio items:', error);
      alert('Erreur lors du chargement');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getPortfolioCategories();
      // Coerce les valeurs null -> 0 pour correspondre au type local
      const normalized = (data || []).map((c) => ({
        ...c,
        order_index: c.order_index ?? 0,
      })) as unknown as Category[];
      setCategories(normalized);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Erreur lors du chargement des catégories');
    }
  };

  const handleSaveCategory = async (id: string | null, name: string, orderIndex: number) => {
    try {
      if (id) {
        await updatePortfolioCategory(id, name, orderIndex);
      } else {
        await createPortfolioCategory(name, orderIndex);
      }
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deletePortfolioCategory(id);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, 'portfolio');
      setEditingItem({ ...editingItem, url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.url || !editingItem.title || !editingItem.description) {
      alert('Veuillez remplir tous les champs obligatoires et télécharger une image');
      return;
    }

    setLoading(true);
    try {
      if (editingItem.id) {
        await updatePortfolioItem(editingItem.id, editingItem);
      } else {
        await createPortfolioItem({
          url: editingItem.url,
          title: editingItem.title,
          description: editingItem.description,
          detailed_description: editingItem.detailed_description || '',
          alt: editingItem.alt || editingItem.title,
          category: editingItem.category || 'Cils',
          show_on_home: editingItem.show_on_home || false,
          order_index: editingItem.order_index || 0,
        });
      }
      await loadItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    setLoading(true);
    try {
      await deletePortfolioItem(id);
      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHome = async (item: PortfolioItem) => {
    const homeItems = items.filter(i => i.show_on_home);
    if (!item.show_on_home && homeItems.length >= 6) {
      alert('Maximum 6 images peuvent être affichées sur la page d\'accueil');
      return;
    }

    setLoading(true);
    try {
      await updatePortfolioItem(item.id, { show_on_home: !item.show_on_home });
      await loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top)]">
      <div className="bg-white w-full sm:max-w-6xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header sticky pour une bonne ergonomie mobile */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="font-display text-lg sm:text-2xl font-bold text-gray-900">Gérer le Portfolio</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(90vh-80px)]">
          <CategoryManager
            categories={categories}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />

          <button
            onClick={() => setEditingItem({ title: '', description: '', detailed_description: '', url: '', alt: '', category: categories[0]?.name || '', show_on_home: false, order_index: items.length })}
            className="mb-6 w-full sm:w-auto justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter une création
          </button>

          {editingItem && (
            <div className="mb-6 p-4 sm:p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem.id ? 'Modifier la création' : 'Nouvelle création'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image *
                  </label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <Upload size={20} />
                      {uploading ? 'Téléchargement...' : 'Choisir une image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {editingItem.url && (
                      <img src={editingItem.url} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description courte *</label>
                  <input
                    type="text"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description détaillée</label>
                  <textarea
                    value={editingItem.detailed_description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, detailed_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select
                    value={editingItem.category || categories[0]?.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texte alternatif</label>
                  <input
                    type="text"
                    value={editingItem.alt || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, alt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showOnHome"
                    checked={editingItem.show_on_home || false}
                    onChange={(e) => setEditingItem({ ...editingItem, show_on_home: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="showOnHome" className="text-sm font-medium text-gray-700">
                    Afficher sur la page d'accueil
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading || uploading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <img src={item.url} alt={item.alt} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  {item.show_on_home && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-3">
                      Sur l'accueil
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleHome(item)}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {item.show_on_home ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
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

export default PortfolioEditor;
