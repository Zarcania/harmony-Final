import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order_index: number;
}

interface CategoryManagerProps {
  categories: Category[];
  onSave: (id: string | null, name: string, orderIndex: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onSave, onDelete }) => {
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!editingCategory?.name) {
      alert('Veuillez entrer un nom de catégorie');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        editingCategory.id || null,
        editingCategory.name,
        editingCategory.order_index || categories.length
      );
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;

    setLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gestion des catégories</h3>
        <button
          onClick={() => setEditingCategory({ name: '', order_index: categories.length })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Nouvelle catégorie
        </button>
      </div>

      {editingCategory && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={editingCategory.name || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Cils, Sourcils, Maquillage..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                Sauvegarder
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={category.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
              <span className="font-medium">{category.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCategory(category)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
