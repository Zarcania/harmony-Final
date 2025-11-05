import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Type, DollarSign, Image as ImageIcon } from 'lucide-react';
import { uploadImage, getPortfolioCategories } from '../services/contentService';

interface AdminEditModalProps {
  type: 'portfolio' | 'service-section' | 'service-item' | 'background';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void;
  onClose: () => void;
  homeCount?: number;
  homeMax?: number; // quota affichage accueil
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ type, data, onSave, onClose, homeCount, homeMax = 6 }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(data || {});
  const modalRef = useRef<HTMLDivElement>(null);

  // Portfolio-only states
  // Par défaut: "fichier" (même si un élément existant a une URL)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [previewUrl, setPreviewUrl] = useState<string | null>(data?.url ?? null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Accessibility + body scroll lock
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const t = setTimeout(() => {
      modalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      modalRef.current?.focus();
    }, 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Validations + preview (portfolio only)
  useEffect(() => {
    if (type !== 'portfolio') return;
    const nextErrors: string[] = [];
    const nextWarnings: string[] = [];
    let objectUrl: string | null = null;

    if (uploadMode === 'file' && formData.file instanceof File) {
      const f: File = formData.file;
      if (f.size > 5 * 1024 * 1024) nextErrors.push('Le fichier dépasse 5 Mo.');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) nextErrors.push('Format non supporté (JPEG, PNG, WEBP uniquement).');
      objectUrl = URL.createObjectURL(f);
      setPreviewUrl(objectUrl);
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio < 0.7 || ratio > 0.9) nextWarnings.push('Le ratio conseillé est 4:5 (portrait). L’image sera recadrée visuellement.');
        setWarnings(Array.from(new Set(nextWarnings)));
      };
      img.src = objectUrl;
    } else if (uploadMode === 'url') {
      const url: string | undefined = formData.url;
      if (!url || !/^https?:\/\//i.test(url)) {
        nextErrors.push('URL invalide ou manquante.');
        setPreviewUrl(null);
      } else {
        if (!/(\.jpe?g|\.png|\.webp)(\?|$)/i.test(url)) nextWarnings.push('Extension inconnue: assurez-vous que l’URL pointe vers une image.');
        setPreviewUrl(url);
        const img = new window.Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio < 0.7 || ratio > 0.9) nextWarnings.push('Le ratio conseillé est 4:5 (portrait). L’image sera recadrée visuellement.');
          setWarnings(Array.from(new Set(nextWarnings)));
        };
        img.onerror = () => setWarnings(w => Array.from(new Set([...w, 'Impossible de charger l’URL (vérifiez l’accessibilité).'])));
        img.src = url;
      }
    } else {
      setPreviewUrl(null);
    }

    setErrors(nextErrors);
    if (nextWarnings.length === 0) setWarnings([]);

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [type, uploadMode, formData.file, formData.url]);

  // Charger les catégories pour le sélecteur (portfolio)
  useEffect(() => {
    if (type !== 'portfolio') return;
    let active = true;
    (async () => {
      try {
  const data = await getPortfolioCategories();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = (data || []).map((c: any) => c?.name as string).filter(Boolean) as string[];
        if (active) setCategories(names);
      } catch (e) {
        console.warn('Impossible de charger les catégories du portfolio:', e);
      }
    })();
    return () => { active = false; };
  }, [type]);

  const handleSave = async () => {
    try {
      if (errors.length) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { ...formData };

      if (type === 'portfolio') {
        if (uploadMode === 'file' && formData.file instanceof File) {
          const publicUrl = await uploadImage(formData.file as File, 'portfolio');
          payload.url = publicUrl;
        }
        if (!payload.alt) payload.alt = payload.title ? `${payload.title}` : 'Harmonie Cils - Portfolio';
      }

      onSave(payload);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert("Impossible d'enregistrer. Vérifiez votre connexion et vos droits administrateur.");
    }
  };

  const renderPortfolioForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-harmonie-700">Source</label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="uploadMode" checked={uploadMode === 'file'} onChange={() => setUploadMode('file')} />
          Fichier
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="uploadMode" checked={uploadMode === 'url'} onChange={() => setUploadMode('url')} />
          URL
        </label>
      </div>

      {uploadMode === 'file' && (
        <div>
          <label htmlFor="portfolio-file" className="block text-sm font-medium text-harmonie-700 mb-2">Fichier image</label>
          <input
            type="file"
            id="portfolio-file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
            className="block w-full text-sm border border-harmonie-200 rounded-lg bg-white focus:outline-none file:mr-3 file:px-3 file:py-2.5 file:rounded-lg file:border-0 file:bg-harmonie-600 file:text-white hover:file:bg-harmonie-700"
          />
          <p className="text-xs text-harmonie-500 mt-1">PNG, JPG, ou WEBP. 5 Mo max.</p>
        </div>
      )}

      {uploadMode === 'url' && (
        <div>
          <label htmlFor="portfolio-url" className="block text-sm font-medium text-harmonie-700 mb-2">URL de l'image</label>
          <input
            type="url"
            id="portfolio-url"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
            placeholder="https://..."
          />
        </div>
      )}

      {previewUrl && (
        <div className="rounded-xl border border-harmonie-200 p-3 bg-white">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-harmonie-50">
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
          </div>
          {warnings.length > 0 && (
            <ul className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 list-disc list-inside">
              {warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          )}
        </div>
      )}

      <label htmlFor="portfolio-category" className="block text-sm font-medium text-harmonie-700 mb-2">Catégorie</label>
        {categories.length > 0 ? (
          <select
            id="portfolio-category"
            value={formData.category || categories[0]}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          >
            {categories.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <select
            id="portfolio-category"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white text-harmonie-500"
            disabled
          >
            <option>Aucune catégorie définie</option>
          </select>
        )}

      <div>
        <label htmlFor="portfolio-title" className="block text-sm font-medium text-harmonie-700 mb-2">Titre</label>
        <input
          type="text"
          id="portfolio-title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          placeholder="Titre de l'image"
        />
      </div>

      <div>
        <label htmlFor="portfolio-description" className="block text-sm font-medium text-harmonie-700 mb-2">Description</label>
        <textarea
          id="portfolio-description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          rows={3}
          placeholder="Courte description"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="portfolio-showOnHome"
            checked={formData.showOnHome || false}
            onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
            className="w-4 h-4 text-harmonie-600 rounded focus:ring-harmonie-500"
            disabled={Boolean(!formData.showOnHome && typeof homeCount === 'number' && homeCount >= homeMax)}
          />
          <label htmlFor="portfolio-showOnHome" className="text-sm font-medium text-harmonie-700">Afficher sur la page d'accueil</label>
        </div>
        {typeof homeCount === 'number' && (
          <span className={`text-xs font-medium ${homeCount >= homeMax ? 'text-red-700' : 'text-harmonie-700'}`}>
            Accueil: {homeCount}/{homeMax}
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 list-disc list-inside">
          {errors.map((er, i) => (<li key={i}>{er}</li>))}
        </ul>
      )}
    </div>
  );

  const renderServiceSectionForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="service-section-title" className="block text-sm font-medium text-harmonie-700 mb-2">Titre de la section</label>
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
        <label htmlFor="service-section-icon" className="block text-sm font-medium text-harmonie-700 mb-2">Icône (nom Lucide)</label>
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
        <label htmlFor="service-item-label" className="block text-sm font-medium text-harmonie-700 mb-2">Nom du service</label>
          <input
          type="text"
          id="service-item-label"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          placeholder="Nom du service"
        />
      </div>
      <div>
        <label htmlFor="service-item-price" className="block text-sm font-medium text-harmonie-700 mb-2">Prix</label>
          <input
          type="text"
          id="service-item-price"
          value={formData.price || ''}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 25€"
        />
      </div>
      <div>
        <label htmlFor="service-item-duration" className="block text-sm font-medium text-harmonie-700 mb-2">Durée (optionnel)</label>
          <input
          type="text"
          id="service-item-duration"
          value={formData.duration || ''}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          placeholder="Ex: 1h30, 45min, 2h"
        />
      </div>
      <div>
        <label htmlFor="service-item-description" className="block text-sm font-medium text-harmonie-700 mb-2">Description (optionnel)</label>
        <textarea
          id="service-item-description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-harmonie-200 rounded-lg bg-white focus:ring-2 focus:ring-harmonie-500"
          rows={3}
          placeholder="Description détaillée du service"
        />
      </div>
    </div>
  );

  const renderBackgroundForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="background-url" className="block text-sm font-medium text-harmonie-700 mb-2">URL de l'image de fond</label>
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
        <label htmlFor="background-show" className="text-sm font-medium text-harmonie-700">Afficher l'image de fond</label>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'portfolio': return data ? "Modifier l'image" : 'Ajouter une image';
      case 'service-section': return 'Modifier la section';
      case 'service-item': return data ? 'Modifier le service' : 'Ajouter un service';
      case 'background': return 'Image de fond des prestations';
      default: return 'Modifier';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'portfolio': return <ImageIcon size={20} />;
      case 'service-section': return <Type size={20} />;
      case 'service-item': return <DollarSign size={20} />;
      case 'background': return <ImageIcon size={20} />;
      default: return <Type size={20} />;
    }
  };

  const canSave = () => {
    if (errors.length) return false;
    if (type === 'portfolio') {
      if (uploadMode === 'file') return Boolean(formData.file);
      return Boolean(formData.url && /^https?:\/\//i.test(formData.url));
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-start justify-center p-3 sm:p-6 md:p-8 overscroll-contain touch-none pt-[env(safe-area-inset-top)] sm:pt-24 lg:pt-28">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-modal-title"
        tabIndex={-1}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[75vh] sm:max-h-[75vh] overflow-hidden my-6 sm:my-10"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-4 border-b border-harmonie-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg shrink-0">{getIcon()}</div>
            <h3 id="admin-edit-modal-title" className="font-display text-lg sm:text-xl font-bold text-harmonie-800 truncate">{getTitle()}</h3>
          </div>
          <button onClick={onClose} aria-label="Fermer la modale" className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 pb-28 sm:pb-8 overflow-y-auto max-h-[calc(75vh-7rem)]">
          {type === 'portfolio' && renderPortfolioForm()}
          {type === 'service-section' && renderServiceSectionForm()}
          {type === 'service-item' && renderServiceItemForm()}
          {type === 'background' && renderBackgroundForm()}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-3 border-t border-harmonie-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave()}
            className={`w-full sm:flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${!canSave() ? 'bg-harmonie-300 text-white cursor-not-allowed' : 'bg-harmonie-600 text-white hover:bg-harmonie-700'}`}
          >
            <Save size={18} />
            Sauvegarder
          </button>
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 border border-harmonie-200 text-harmonie-600 rounded-lg hover:bg-harmonie-50 transition-colors font-medium">Annuler</button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditModal;
