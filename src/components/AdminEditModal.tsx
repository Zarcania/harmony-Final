import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Eye, EyeOff, Image, Type, DollarSign } from 'lucide-react';

interface AdminEditModalProps {
  type: 'portfolio' | 'service-section' | 'service-item' | 'background';
  data?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ type, data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || {});

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderPortfolioForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          URL de l'image
        </label>
        <input
          type="url"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="https://..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Titre
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Description détaillée
        </label>
        <textarea
          value={formData.detailedDescription || ''}
          onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          rows={4}
          placeholder="Description complète de la prestation..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Texte alternatif
        </label>
        <input
          type="text"
          value={formData.alt || ''}
          onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showOnHome"
          checked={formData.showOnHome || false}
          onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
          className="w-4 h-4 text-harmonie-600 rounded focus:ring-harmonie-500"
        />
        <label htmlFor="showOnHome" className="text-sm font-medium text-harmonie-700">
          Afficher sur la page d'accueil
        </label>
      </div>
    </div>
  );

  const renderServiceSectionForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Titre de la section
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Icône (nom Lucide)
        </label>
        <input
          type="text"
          value={formData.icon || ''}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: Eye, Heart, Scissors..."
        />
      </div>
    </div>
  );

  const renderServiceItemForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Nom du service
        </label>
        <input
          type="text"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Prix
        </label>
        <input
          type="text"
          value={formData.price || ''}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 25€"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Durée (optionnel)
        </label>
        <input
          type="text"
          value={formData.duration || ''}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 1h30, 45min, 2h"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          Description (optionnel)
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          rows={3}
          placeholder="Description détaillée du service"
        />
      </div>
    </div>
  );

  const renderBackgroundForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-harmonie-700 mb-2">
          URL de l'image de fond
        </label>
        <input
          type="url"
          value={formData.backgroundImage || ''}
          onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showBackground"
          checked={formData.showBackground || false}
          onChange={(e) => setFormData({ ...formData, showBackground: e.target.checked })}
          className="w-4 h-4 text-harmonie-600 rounded focus:ring-harmonie-500"
        />
        <label htmlFor="showBackground" className="text-sm font-medium text-harmonie-700">
          Afficher l'image de fond
        </label>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'portfolio': return data ? 'Modifier l\'image' : 'Ajouter une image';
      case 'service-section': return 'Modifier la section';
      case 'service-item': return data ? 'Modifier le service' : 'Ajouter un service';
      case 'background': return 'Image de fond des prestations';
      default: return 'Modifier';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'portfolio': return <Image size={20} />;
      case 'service-section': return <Type size={20} />;
      case 'service-item': return <DollarSign size={20} />;
      case 'background': return <Image size={20} />;
      default: return <Type size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              {getIcon()}
            </div>
            <h3 className="font-display text-xl font-bold text-harmonie-800">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="mb-6">
          {type === 'portfolio' && renderPortfolioForm()}
          {type === 'service-section' && renderServiceSectionForm()}
          {type === 'service-item' && renderServiceItemForm()}
          {type === 'background' && renderBackgroundForm()}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-harmonie-600 text-white py-3 px-4 rounded-lg hover:bg-harmonie-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Save size={18} />
            Sauvegarder
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-harmonie-200 text-harmonie-600 rounded-lg hover:bg-harmonie-50 transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditModal;