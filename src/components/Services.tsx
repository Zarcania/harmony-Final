import React from 'react';
import { Eye, Scissors, Sparkles, Heart, Wand2, Brush, Droplet, Star, Leaf, Gem, Pipette, CreditCard as Edit, Plus, Trash2, Calendar, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ServiceItem {
  id: string;
  label: string;
  price: string;
  duration?: string;
  description?: string;
}

interface ServiceSection {
  id: string;
  title: string;
  items: ServiceItem[];
  icon: string;
}

interface ServicesProps {
  onNavigate: (page: string, service?: string) => void;
}

const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
  const {
    isAdmin,
    serviceSections,
    updateServiceSection,
    updateServiceItem,
    addServiceItem,
    deleteServiceItem,
    addServiceSection,
    moveServiceSection
  } = useAdmin();

  // Suppression de la modale d'image de fond

  // Edition inline des sections et items
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = React.useState<Partial<ServiceSection>>({});
  const [editingItemKey, setEditingItemKey] = React.useState<string | null>(null); // "sectionId:itemId" ou "sectionId:new"
  const [itemDraft, setItemDraft] = React.useState<Partial<ServiceItem> & { service_id?: string; id?: string }>({});
  const { elementRef: titleLeftRef } = useScrollAnimation();
  const { elementRef: titleRightRef } = useScrollAnimation();

  const [isNavSticky, setIsNavSticky] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const navElement = document.getElementById('quick-nav');
      if (navElement) {
        const navOffset = navElement.offsetTop;
        setIsNavSticky(window.scrollY > navOffset - 20);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getHeaderOffset = () => {
    // Hauteur du header fixe + marge
    const header = document.querySelector('header');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
    return headerHeight + (isNavSticky ? 60 : 20);
  };

  const scrollToSection = (sectionId: string, updateHash: boolean = true) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (!element) return;
    const offset = getHeaderOffset();
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    if (updateHash) {
      const path = window.location.pathname;
      window.history.replaceState(null, '', `${path}#section-${sectionId}`);
    }
  };

  React.useEffect(() => {
    // Si un hash est présent au chargement de la page prestations, scroller dessus
    if (window.location.hash.startsWith('#section-')) {
      const id = window.location.hash.replace('#section-', '');
      // laisser le temps au layout de se peindre
      setTimeout(() => scrollToSection(id, false), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Options d'icônes pour les sections (thème beauté/esthétique)
  const iconOptions = [
    { key: 'Eye', label: 'Œil (cils)' },
    { key: 'Scissors', label: 'Ciseaux' },
    { key: 'Heart', label: 'Cœur' },
    { key: 'Sparkles', label: 'Étincelles' },
    { key: 'Wand2', label: 'Baguette beauté' },
    { key: 'Brush', label: 'Pinceau' },
    { key: 'Droplet', label: 'Goutte (soin)' },
    { key: 'Star', label: 'Étoile' },
    { key: 'Leaf', label: 'Feuille (naturel)' },
    { key: 'Gem', label: 'Gem (précieux)' },
    { key: 'Pipette', label: 'Pipette (teinture)' },
  ] as const;

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Scissors': <Scissors className="w-6 h-6" />,
      'Heart': <Heart className="w-6 h-6" />,
      'Eye': <Eye className="w-6 h-6" />,
      'Sparkles': <Sparkles className="w-6 h-6" />,
      'Wand2': <Wand2 className="w-6 h-6" />,
      'Brush': <Brush className="w-6 h-6" />,
      'Droplet': <Droplet className="w-6 h-6" />,
      'Star': <Star className="w-6 h-6" />,
      'Leaf': <Leaf className="w-6 h-6" />,
      'Gem': <Gem className="w-6 h-6" />,
      'Pipette': <Pipette className="w-6 h-6" />,
    };
    return icons[iconName] || <Eye className="w-6 h-6" />;
  };

  // Inline save handlers
  const startEditSection = (section: ServiceSection) => {
    setEditingSectionId(section.id);
    setSectionDraft({ id: section.id, title: section.title, icon: section.icon });
  };

  const saveSection = () => {
    if (!editingSectionId || !sectionDraft.title || !sectionDraft.icon) return;
    updateServiceSection(editingSectionId, {
      title: sectionDraft.title,
      icon: sectionDraft.icon,
    });
    setEditingSectionId(null);
    setSectionDraft({});
  };

  const cancelSection = () => {
    setEditingSectionId(null);
    setSectionDraft({});
  };

  const startEditItem = (sectionId: string, item: ServiceItem) => {
    setEditingItemKey(`${sectionId}:${item.id}`);
    setItemDraft({
      service_id: sectionId,
      id: item.id,
      label: item.label,
      price: item.price,
      duration: item.duration,
      description: item.description,
    });
  };

  const startAddItem = (sectionId: string) => {
    setEditingItemKey(`${sectionId}:new`);
    setItemDraft({ service_id: sectionId, label: '', price: '', duration: '', description: '' });
  };

  const saveItem = () => {
    if (!editingItemKey || !itemDraft.service_id || !itemDraft.label || !itemDraft.price) return;
    const [sectionId, itemId] = editingItemKey.split(':');
    if (itemId === 'new') {
      addServiceItem(sectionId, {
        label: itemDraft.label!,
        price: itemDraft.price!,
        duration: itemDraft.duration || '',
        description: itemDraft.description || '',
      });
    } else {
      updateServiceItem(sectionId, itemId, {
        label: itemDraft.label!,
        price: itemDraft.price!,
        duration: itemDraft.duration,
        description: itemDraft.description,
      });
    }
    setEditingItemKey(null);
    setItemDraft({});
  };

  const cancelItem = () => {
    setEditingItemKey(null);
    setItemDraft({});
  };

  // (Ancienne gestion d'image de fond supprimée)

  // Ajout d'une nouvelle section
  const [newSection, setNewSection] = React.useState<{ title: string; icon: string }>({ title: '', icon: 'Eye' });

  return (
    <section id="prestations" className="relative py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div id="services-title" className="text-center mb-8 md:mb-16">
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-black mb-3 md:mb-4 leading-tight">
            <span ref={titleLeftRef} className="inline-block">Prestations</span>
            <span> & </span>
            <span ref={titleRightRef} className="inline-block">Tarifs</span>
          </h2>
          <p className="text-sm md:text-lg text-gray-700 max-w-2xl mx-auto leading-snug">
            Nos soins pour sublimer votre beauté
          </p>
          {/* Bouton image de fond supprimé comme demandé */}
        </div>

        {/* Navigation rapide */}
        <div id="quick-nav" className="mb-6 md:mb-12">
          <div className={`${
            isNavSticky
              ? 'fixed top-0 left-0 right-0 z-40 bg-white py-2'
              : 'relative'
          }`}>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                {serviceSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="px-3 py-2 md:px-6 md:py-3 bg-pink-50 border-2 border-pink-200 text-neutral-900 rounded-full text-sm md:text-base font-medium hover:bg-pink-100 hover:border-pink-300 transition-colors"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                  <input
                    className="px-3 py-2 border border-neutral-300 rounded w-full sm:w-72"
                    placeholder="Titre de la nouvelle section"
                    value={newSection.title}
                    onChange={(e) => setNewSection(s => ({ ...s, title: e.target.value }))}
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      aria-label="Icône de la nouvelle section"
                      className="px-3 py-2 border border-neutral-300 rounded bg-white w-full sm:w-56"
                      value={newSection.icon}
                      onChange={(e) => setNewSection(s => ({ ...s, icon: e.target.value }))}
                    >
                      {iconOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="p-2 border border-neutral-200 rounded text-neutral-700 bg-white" title="Aperçu">
                      {getIcon(newSection.icon || 'Eye')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (newSection.title.trim()) {
                        addServiceSection({ title: newSection.title.trim(), icon: newSection.icon.trim() || 'Eye' });
                        setNewSection({ title: '', icon: 'Eye' });
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                  >
                    Ajouter une section
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liste horizontale des services */}
        <div className="space-y-8 md:space-y-16 mb-12 md:mb-20">
          {serviceSections.map((section, index) => (
            <div
              key={index}
              id={`section-${section.id}`}
              className="scroll-mt-24"
            >
              <div
                className={`bg-pink-50 rounded-2xl md:rounded-[2rem] p-4 md:p-8 border border-pink-100 relative`}
              >
              <div className="relative z-10">
                {/* En-tête de la carte avec icône */}
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-8 pb-4 md:pb-6 border-b-2 border-neutral-200/60">
                  <div className="relative">
                    <div className="p-3 md:p-4 bg-neutral-900 text-white rounded-xl md:rounded-2xl shadow">
                      {getIcon(section.icon)}
                    </div>
                    {/* Point décoratif */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neutral-900 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-neutral-900 mb-0.5 tracking-tight leading-tight">
                      {section.title}
                    </h3>
                    {isAdmin && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => moveServiceSection(section.id, 'up')}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 rounded"
                          title="Monter la section"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveServiceSection(section.id, 'down')}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 rounded"
                          title="Descendre la section"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-2">
                        {editingSectionId === section.id ? (
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <input
                              className="px-2 py-1 border border-neutral-300 rounded"
                              placeholder="Titre"
                              value={sectionDraft.title || ''}
                              onChange={(e) => setSectionDraft(s => ({ ...s, title: e.target.value }))}
                            />
                            <div className="flex items-center gap-2">
                              <select
                                aria-label="Icône de la section"
                                className="px-2 py-1 border border-neutral-300 rounded bg-white"
                                value={sectionDraft.icon || 'Eye'}
                                onChange={(e) => setSectionDraft(s => ({ ...s, icon: e.target.value }))}
                              >
                                {iconOptions.map(opt => (
                                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                              </select>
                              <div className="p-1.5 border border-neutral-200 rounded text-neutral-700 bg-white" title="Aperçu">
                                {getIcon(sectionDraft.icon || 'Eye')}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveSection} className="text-green-700 hover:text-green-900 p-1.5 hover:bg-green-100 rounded" title="Enregistrer">
                                <Save size={16} />
                              </button>
                              <button onClick={cancelSection} className="text-neutral-700 hover:text-neutral-900 p-1.5 hover:bg-neutral-100 rounded" title="Annuler">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditSection(section)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <Edit size={12} />
                            <span className="text-xs">Modifier</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Liste des services */}
                <div className="space-y-2 md:space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 py-3 px-3 md:px-4 rounded-xl ${
                        isAdmin
                          ? ''
                          : ''
                      } ${itemIndex !== section.items.length - 1 ? 'border-b border-neutral-200/50' : ''}`}
                    >
                      {/* Indicateur supprimé */}

                      <div
                        className="flex-1 flex flex-col gap-2 pl-0 sm:pl-2 w-full sm:w-auto"
                      >
                        {editingItemKey === `${section.id}:${item.id}` ? (
                          <div className="flex flex-col gap-3 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                className="px-3 py-2 border border-neutral-300 rounded"
                                placeholder="Nom du service"
                                value={itemDraft.label || ''}
                                onChange={(e) => setItemDraft(d => ({ ...d, label: e.target.value }))}
                              />
                              <input
                                className="px-3 py-2 border border-neutral-300 rounded"
                                placeholder="Prix (ex: 25€)"
                                value={itemDraft.price || ''}
                                onChange={(e) => setItemDraft(d => ({ ...d, price: e.target.value }))}
                              />
                              <input
                                className="px-3 py-2 border border-neutral-300 rounded"
                                placeholder="Durée (ex: 45min)"
                                value={itemDraft.duration || ''}
                                onChange={(e) => setItemDraft(d => ({ ...d, duration: e.target.value }))}
                              />
                              <textarea
                                className="px-3 py-2 border border-neutral-300 rounded sm:col-span-2"
                                placeholder="Description (optionnel)"
                                rows={2}
                                value={itemDraft.description || ''}
                                onChange={(e) => setItemDraft(d => ({ ...d, description: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveItem} className="text-green-700 hover:text-green-900 p-1.5 hover:bg-green-100 rounded flex items-center gap-1" title="Enregistrer">
                                <Save size={16} /> <span className="text-sm">Enregistrer</span>
                              </button>
                              <button onClick={cancelItem} className="text-neutral-700 hover:text-neutral-900 p-1.5 hover:bg-neutral-100 rounded flex items-center gap-1" title="Annuler">
                                <X size={16} /> <span className="text-sm">Annuler</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 w-full">
                            <div className="flex-1 w-full">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-neutral-900 font-semibold text-sm md:text-base leading-tight group-hover/item:text-neutral-700 transition-colors">
                                  {item.label}
                                </span>
                                {item.duration && (
                                  <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-full font-medium border border-pink-200">
                                    ⏱ {item.duration}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 text-lg md:text-xl tracking-tight whitespace-nowrap">
                                {item.price}
                              </span>
                              {/* Badge décoratif retiré */}
                            </div>
                          </div>
                        )}
                      </div>
                      {!isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('contact', item.label);
                          }}
                          className="w-full sm:w-auto sm:ml-3 bg-neutral-900 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium shadow-md hover:shadow-xl transform hover:scale-105"
                        >
                          <Calendar size={14} className="md:w-4 md:h-4" />
                          <span className="whitespace-nowrap">Prendre RDV</span>
                        </button>
                      )}
                      {isAdmin && (
                        <div className="flex gap-1 ml-2">
                          {editingItemKey === `${section.id}:${item.id}` ? (
                            <></>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditItem(section.id, item)}
                                className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => deleteServiceItem(section.id, item.id)}
                                className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAdmin && (
                    <button
                      onClick={() => startAddItem(section.id)}
                      className="w-full mt-4 py-2.5 border-2 border-dashed border-harmonie-300 text-harmonie-600 rounded-xl hover:border-harmonie-500 hover:text-harmonie-800 hover:bg-harmonie-50/30 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus size={16} />
                      Ajouter un service
                    </button>
                  )}

                  {isAdmin && editingItemKey === `${section.id}:new` && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border-2 border-green-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          className="px-3 py-2 border border-neutral-300 rounded"
                          placeholder="Nom du service"
                          value={itemDraft.label || ''}
                          onChange={(e) => setItemDraft(d => ({ ...d, label: e.target.value }))}
                        />
                        <input
                          className="px-3 py-2 border border-neutral-300 rounded"
                          placeholder="Prix (ex: 25€)"
                          value={itemDraft.price || ''}
                          onChange={(e) => setItemDraft(d => ({ ...d, price: e.target.value }))}
                        />
                        <input
                          className="px-3 py-2 border border-neutral-300 rounded"
                          placeholder="Durée (ex: 45min)"
                          value={itemDraft.duration || ''}
                          onChange={(e) => setItemDraft(d => ({ ...d, duration: e.target.value }))}
                        />
                        <textarea
                          className="px-3 py-2 border border-neutral-300 rounded sm:col-span-2"
                          placeholder="Description (optionnel)"
                          rows={2}
                          value={itemDraft.description || ''}
                          onChange={(e) => setItemDraft(d => ({ ...d, description: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={saveItem} className="text-green-700 hover:text-green-900 p-1.5 hover:bg-green-100 rounded flex items-center gap-1" title="Enregistrer">
                          <Save size={16} /> <span className="text-sm">Enregistrer</span>
                        </button>
                        <button onClick={cancelItem} className="text-neutral-700 hover:text-neutral-900 p-1.5 hover:bg-neutral-100 rounded flex items-center gap-1" title="Annuler">
                          <X size={16} /> <span className="text-sm">Annuler</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              {/* Fermeture du conteneur de section (scroll-mt-24) manquante */}
              </div>
          ))}
        </div>

        {/* CTA simple */}
        <div className="text-center bg-neutral-900 rounded-2xl md:rounded-3xl p-6 md:p-16 text-white shadow-2xl">
          <h3 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight">
            Prête à transformer votre regard ?
          </h3>
          <p className="text-sm md:text-lg mb-6 md:mb-8 text-white/80 font-light max-w-xl mx-auto leading-snug">
            Prenez rendez-vous dès maintenant
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="bg-white text-neutral-900 px-6 md:px-12 py-3 md:py-4 rounded-full font-semibold text-sm md:text-lg hover:bg-neutral-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg inline-flex items-center gap-2"
          >
            Prendre rendez-vous
            <span className="text-lg md:text-xl">→</span>
          </button>
        </div>
      </div>

    </section>
  );
};

export default Services;