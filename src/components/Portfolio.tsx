import React, { useState, useEffect } from 'react';
import { Camera, ExternalLink, CreditCard as Edit, Plus, Trash2, Eye, EyeOff, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import AdminEditModal from './AdminEditModal';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { getPortfolioCategories, createPortfolioCategory, updatePortfolioCategory, deletePortfolioCategory } from '../services/contentService';

interface Category {
  id: string;
  name: string;
  order_index: number;
}

interface PortfolioProps {
  onNavigate: (page: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onNavigate: _onNavigate }) => {
  void _onNavigate; // mark as used to satisfy no-unused-vars
  const { isAdmin, portfolioImages, updatePortfolioImage, addPortfolioImage, deletePortfolioImage } = useAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editModal, setEditModal] = React.useState<{ type: string; data?: any } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getPortfolioCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredImages = selectedCategory === 'all'
    ? portfolioImages
    : portfolioImages.filter(img => img.category === selectedCategory);

  const handleToggleHome = (id: string, currentStatus: boolean) => {
    const homeImages = portfolioImages.filter(img => img.showOnHome);
    
    if (!currentStatus && homeImages.length >= 6) {
      alert('Maximum 6 images peuvent être affichées sur la page d\'accueil');
      return;
    }
    
    updatePortfolioImage(id, { showOnHome: !currentStatus });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveImage = (data: any) => {
    if (data.id) {
      updatePortfolioImage(data.id, data);
    } else {
      addPortfolioImage(data);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await createPortfolioCategory(name, categories.length);
      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleUpdateCategory = async (id: string, name: string, orderIndex: number) => {
    try {
      await updatePortfolioCategory(id, name, orderIndex);
      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      await deletePortfolioCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erreur lors de la suppression de la catégorie');
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    setCategories(newCategories);

    try {
      await Promise.all(
        newCategories.map((cat, i) =>
          updatePortfolioCategory(cat.id, cat.name, i)
        )
      );
    } catch (error) {
      console.error('Error moving category:', error);
      alert('Erreur lors du déplacement de la catégorie');
      await loadCategories();
    }
  };

  return (
    <section id="portfolio" className="relative py-24 bg-gradient-to-b from-white via-harmonie-50/30 to-white overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -right-20 w-96 h-96 bg-harmonie-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-20 w-96 h-96 bg-harmonie-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* En-tête moderne */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-400 to-transparent"></div>
            <Camera className="w-5 h-5 text-harmonie-600" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-400 to-transparent"></div>
          </div>

          <h2 ref={titleRef} className={`font-display text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-5 tracking-tight transition-all duration-[1200ms] ease-out ${
            titleVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-[120px]'
          }`}>
            Portfolio
          </h2>
          <p className={`text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-snug transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez nos créations
          </p>

          {/* Filtres de catégories */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-harmonie-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-harmonie-50 border border-gray-200'
              }`}
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat.name
                    ? 'bg-harmonie-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-harmonie-50 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-8 flex gap-3 justify-center">
              <button
                onClick={() => setEditModal({ type: 'portfolio' })}
                className="bg-harmonie-600 text-white px-6 py-3 rounded-full hover:bg-harmonie-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus size={18} />
                Ajouter une image
              </button>
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Settings size={18} />
                Gérer les catégories
              </button>
            </div>
          )}
        </div>

        {/* Galerie masonry moderne */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {filteredImages.map((image, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 ${
                isAdmin ? 'ring-2 ring-dashed ring-harmonie-300 hover:ring-harmonie-500' : ''
              }`}
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {!isAdmin && (
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/95 via-neutral-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-8">
                    {/* Ligne décorative animée */}
                    <div className="w-0 h-0.5 bg-gradient-to-r from-harmonie-400 to-harmonie-600 mb-6 group-hover:w-16 transition-all duration-700 delay-200"></div>

                    <div className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                      <h3 className="font-display text-2xl font-bold text-white mb-3 leading-tight">
                        {image.title}
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
                        {image.detailedDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Overlay admin */}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditModal({ type: 'portfolio', data: image })}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleHome(image.id, image.showOnHome)}
                      className={`p-2 rounded-lg transition-colors ${
                        image.showOnHome 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={image.showOnHome ? 'Retirer de l\'accueil' : 'Ajouter à l\'accueil'}
                    >
                      {image.showOnHome ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => deletePortfolioImage(image.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Badge accueil */}
              {isAdmin && image.showOnHome && (
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  Accueil
                </div>
              )}

              {/* Info card en bas - Design moderne */}
              <div className="p-3 md:p-4 bg-gradient-to-b from-white to-neutral-50/50">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-sm md:text-base font-semibold text-neutral-900 group-hover:text-harmonie-700 transition-colors duration-300 line-clamp-1 flex-1">
                    {image.title}
                  </h3>
                  <span className="text-[10px] bg-harmonie-100 text-harmonie-700 px-2 py-0.5 rounded-full font-medium ml-2 shrink-0">
                    {image.category}
                  </span>
                </div>
                <p className="text-neutral-600 text-xs leading-snug line-clamp-2">
                  {image.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section moderne */}
        <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl md:rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
            {/* Pattern de fond */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:40px_40px]"></div>
            </div>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
                <Camera className="w-3 h-3 text-harmonie-300" />
                <span className="text-white/80 text-xs font-medium">Instagram</span>
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                Suivez nos créations
              </h3>
              <p className="text-white/70 text-sm md:text-base mb-6 max-w-xl mx-auto leading-snug">
                Retrouvez nos réalisations du jour sur Instagram
              </p>

              <a
                href="https://instagram.com/harmoniecils"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-medium text-sm hover:bg-neutral-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg"
              >
                <Camera size={18} />
                <span>Suivre sur Instagram</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editModal && (
        <AdminEditModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type={editModal.type as any}
          data={editModal.data}
          onSave={handleSaveImage}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Modal de gestion des catégories */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-bold text-harmonie-800">
                Gérer les catégories
              </h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
                aria-label="Fermer la gestion des catégories"
                title="Fermer"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  id="newCategoryInput"
                  placeholder="Nom de la nouvelle catégorie"
                  className="flex-1 p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        handleAddCategory(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('newCategoryInput') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleAddCategory(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="bg-harmonie-600 text-white px-6 py-3 rounded-lg hover:bg-harmonie-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {categories.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-3 p-4 bg-harmonie-50 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-harmonie-600 hover:bg-harmonie-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Monter la catégorie"
                      title="Monter"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 text-harmonie-600 hover:bg-harmonie-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Descendre la catégorie"
                      title="Descendre"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    aria-label="Nom de la catégorie"
                    placeholder="Nom de la catégorie"
                    value={cat.name}
                    onChange={(e) => handleUpdateCategory(cat.id, e.target.value, cat.order_index)}
                    className="flex-1 p-2 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500"
                  />
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Supprimer la catégorie"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Portfolio;