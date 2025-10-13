import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Image, Type, DollarSign } from 'lucide-react';
import { uploadImage } from '../services/contentService';

interface AdminEditModalProps {
  type: 'portfolio' | 'service-section' | 'service-item' | 'background';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void;
  onClose: () => void;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ type, data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || {});
  const modalRef = useRef<HTMLDivElement>(null);

  // Assure que la modale s'affiche toujours devant l'utilisateur (mobile inclus)
  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est peint avant le scroll/focus
    const t = setTimeout(() => {
      modalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      modalRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleSave = async () => {
    // Si on ajoute/modifie un élément du portfolio et qu'un fichier est fourni, on l'upload d'abord
    try {
      if (type === 'portfolio' && formData.file instanceof File) {
        const publicUrl = await uploadImage(formData.file as File, 'portfolio');
        formData.url = publicUrl;
      }
      onSave(formData);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert("Impossible d'enregistrer l'image. Vérifiez votre connexion et vos droits administrateur.");
    }
  };

  const renderPortfolioForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="portfolio-file" className="block text-sm font-medium text-harmonie-700 mb-2">
          Fichier image
        </label>
        <input
          type="file"
          id="portfolio-file"
          accept="image/*"
          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
          className="block w-full text-sm border border-harmonie-200 rounded-lg bg-white focus:outline-none file:mr-3 file:px-3 file:py-2.5 file:rounded-lg file:border-0 file:bg-harmonie-600 file:text-white hover:file:bg-harmonie-700"
        />
        <p className="text-xs text-harmonie-500 mt-1">PNG, JPG, ou WEBP. 5 Mo max.</p>
      </div>

      <div>
        <label htmlFor="portfolio-url" className="block text-sm font-medium text-harmonie-700 mb-2">
          URL de l'image
        </label>
        <input
          type="url"
          id="portfolio-url"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="https://..."
        />
      </div>
      <div>
        <label htmlFor="portfolio-category" className="block text-sm font-medium text-harmonie-700 mb-2">
          Catégorie
        </label>
        <input
          type="text"
          id="portfolio-category"
          value={formData.category || ''}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: Cils, Sourcils..."
        />
      </div>
      
      <div>
        <label htmlFor="portfolio-title" className="block text-sm font-medium text-harmonie-700 mb-2">
          Titre
        </label>
        <input
          type="text"
          id="portfolio-title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Titre de l'image"
        />
      </div>

      <div>
        <label htmlFor="portfolio-description" className="block text-sm font-medium text-harmonie-700 mb-2">
          Description
        </label>
        <textarea
          id="portfolio-description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          rows={3}
          placeholder="Courte description"
        />
      </div>

      {/* Champs supprimés: Description détaillée et Texte alternatif */}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="portfolio-showOnHome"
          checked={formData.showOnHome || false}
          onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
          className="w-4 h-4 text-harmonie-600 rounded focus:ring-harmonie-500"
        />
        <label htmlFor="portfolio-showOnHome" className="text-sm font-medium text-harmonie-700">
          Afficher sur la page d'accueil
        </label>
      </div>
    </div>
  );

  const renderServiceSectionForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="service-section-title" className="block text-sm font-medium text-harmonie-700 mb-2">
          Titre de la section
        </label>
        <input
          type="text"
          id="service-section-title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Titre de la section"
        />
      </div>

      <div>
        <label htmlFor="service-section-icon" className="block text-sm font-medium text-harmonie-700 mb-2">
          Icône (nom Lucide)
        </label>
        <input
          type="text"
          id="service-section-icon"
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
        <label htmlFor="service-item-label" className="block text-sm font-medium text-harmonie-700 mb-2">
          Nom du service
        </label>
        <input
          type="text"
          id="service-item-label"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Nom du service"
        />
      </div>

      <div>
        <label htmlFor="service-item-price" className="block text-sm font-medium text-harmonie-700 mb-2">
          Prix
        </label>
        <input
          type="text"
          id="service-item-price"
          value={formData.price || ''}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 25€"
        />
      </div>

      <div>
        <label htmlFor="service-item-duration" className="block text-sm font-medium text-harmonie-700 mb-2">
          Durée (optionnel)
        </label>
        <input
          type="text"
          id="service-item-duration"
          value={formData.duration || ''}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 1h30, 45min, 2h"
        />
      </div>

      <div>
        <label htmlFor="service-item-description" className="block text-sm font-medium text-harmonie-700 mb-2">
          Description (optionnel)
        </label>
        <textarea
          id="service-item-description"
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
        <label htmlFor="background-url" className="block text-sm font-medium text-harmonie-700 mb-2">
          URL de l'image de fond
        </label>
        <input
          type="url"
          id="background-url"
          value={formData.backgroundImage || ''}
          onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="background-show"
          checked={formData.showBackground || false}
          onChange={(e) => setFormData({ ...formData, showBackground: e.target.checked })}
          className="w-4 h-4 text-harmonie-600 rounded focus:ring-harmonie-500"
        />
        <label htmlFor="background-show" className="text-sm font-medium text-harmonie-700">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain pt-[env(safe-area-inset-top)]">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-modal-title"
        tabIndex={-1}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* En-tête sticky */}
        <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-4 border-b border-harmonie-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg shrink-0">
              {getIcon()}
            </div>
            <h3 id="admin-edit-modal-title" className="font-display text-lg sm:text-xl font-bold text-harmonie-800 truncate">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la modale"
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="px-4 sm:px-6 py-4 pb-28 sm:pb-8 overflow-y-auto max-h-[calc(92vh-7rem)] sm:max-h-[calc(90vh-8rem)]">
          {type === 'portfolio' && renderPortfolioForm()}
          {type === 'service-section' && renderServiceSectionForm()}
          {type === 'service-item' && renderServiceItemForm()}
          {type === 'background' && renderBackgroundForm()}
        </div>

        {/* Actions sticky bas */}
        <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-3 border-t border-harmonie-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            className="w-full sm:flex-1 bg-harmonie-600 text-white py-3 px-4 rounded-lg hover:bg-harmonie-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Save size={18} />
            Sauvegarder
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 border border-harmonie-200 text-harmonie-600 rounded-lg hover:bg-harmonie-50 transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditModal;