import React from 'react';
import { Eye, Scissors, Sparkles, Heart, CreditCard as Edit, Plus, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import AdminEditModal from './AdminEditModal';
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
    prestationsBackgroundImage,
    setPrestationsBackgroundImage,
    showPrestationsBackground,
    setShowPrestationsBackground
  } = useAdmin();

  const [editModal, setEditModal] = React.useState<{ type: string; data?: any; sectionId?: string } | null>(null);
  const { elementRef: titleLeftRef, isVisible: titleLeftVisible } = useScrollAnimation();
  const { elementRef: titleRightRef, isVisible: titleRightVisible } = useScrollAnimation();

  const [isNavSticky, setIsNavSticky] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const navElement = document.getElementById('quick-nav');
      if (navElement) {
        const navOffset = navElement.offsetTop;
        setIsNavSticky(window.scrollY > navOffset - 80);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const offset = isNavSticky ? 140 : 20;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Scissors': <Scissors className="w-6 h-6" />,
      'Heart': <Heart className="w-6 h-6" />,
      'Eye': <Eye className="w-6 h-6" />,
      'Sparkles': <Sparkles className="w-6 h-6" />
    };
    return icons[iconName] || <Eye className="w-6 h-6" />;
  };

  const handleSaveServiceSection = (data: any) => {
    updateServiceSection(data.id, data);
  };

  const handleSaveServiceItem = (data: any) => {
    if (data.id && editModal?.sectionId) {
      updateServiceItem(editModal.sectionId, data.id, data);
    } else if (editModal?.sectionId) {
      addServiceItem(editModal.sectionId, data);
    }
  };

  const handleSaveBackground = (data: any) => {
    setPrestationsBackgroundImage(data.backgroundImage || '');
    setShowPrestationsBackground(data.showBackground || false);
  };

  return (
    <section 
      id="prestations"
      className="relative py-12 md:py-20"
      style={{
        background: showPrestationsBackground && prestationsBackgroundImage
          ? `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${prestationsBackgroundImage})`
          : 'rgba(255, 255, 255, 0.5)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div id="services-title" className="text-center mb-8 md:mb-16">
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-black mb-3 md:mb-4 leading-tight">
            <span ref={titleLeftRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleLeftVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>Prestations</span>
            <span> & </span>
            <span ref={titleRightRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleRightVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-[120px]'
            }`}>Tarifs</span>
          </h2>
          <p className={`text-sm md:text-lg text-gray-700 max-w-2xl mx-auto leading-snug transition-all duration-[1200ms] ease-out delay-300 ${
            titleLeftVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Nos soins pour sublimer votre beauté
          </p>

          {isAdmin && (
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => setEditModal({
                  type: 'background',
                  data: {
                    backgroundImage: prestationsBackgroundImage,
                    showBackground: showPrestationsBackground
                  }
                })}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Image de fond
              </button>
            </div>
          )}
        </div>

        {/* Navigation rapide */}
        <div id="quick-nav" className="mb-6 md:mb-12">
          <div className={`transition-all duration-300 ${
            isNavSticky
              ? 'fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-lg py-4'
              : 'relative'
          }`}>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                {serviceSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="px-3 py-2 md:px-6 md:py-3 bg-white border-2 border-neutral-300 text-neutral-900 rounded-full text-sm md:text-base font-medium hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
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
                className={`bg-gradient-to-br from-white via-neutral-50 to-white backdrop-blur-lg rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)] transition-all duration-500 border border-neutral-200/60 group relative overflow-hidden ${
                  isAdmin ? 'ring-2 ring-dashed ring-harmonie-300 ring-offset-4 hover:ring-harmonie-500' : ''
                }`}
              >
              {/* Décorations d'arrière-plan subtiles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-neutral-100/40 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-neutral-100/30 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>

              {/* Bordure brillante animée au survol */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-transparent via-neutral-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative z-10">
                {/* En-tête de la carte avec icône */}
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-8 pb-4 md:pb-6 border-b-2 border-neutral-200/60 group-hover:border-neutral-300/80 transition-colors duration-500">
                  <div className="relative">
                    <div className="p-3 md:p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl md:rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
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
                      <button
                        onClick={() => setEditModal({ type: 'service-section', data: section })}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1 flex items-center gap-1"
                      >
                        <Edit size={12} />
                        <span className="text-xs">Modifier</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste des services */}
                <div className="space-y-2 md:space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 py-3 px-3 md:px-4 rounded-xl transition-all duration-300 group/item backdrop-blur-sm ${
                        isAdmin
                          ? 'hover:bg-blue-50/80 hover:shadow-sm'
                          : 'hover:bg-neutral-100/60 hover:shadow-sm'
                      } ${itemIndex !== section.items.length - 1 ? 'border-b border-neutral-200/50' : ''}`}
                    >
                      {/* Petit indicateur décoratif */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-neutral-900 rounded-full group-hover/item:h-8 transition-all duration-300"></div>

                      <div
                        className="flex-1 flex flex-col gap-2 pl-0 sm:pl-2 w-full sm:w-auto"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 w-full">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-neutral-900 font-semibold text-sm md:text-base leading-tight group-hover/item:text-neutral-700 transition-colors">
                                {item.label}
                              </span>
                              {item.duration && (
                                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full font-medium border border-neutral-200">
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
                            <span className="font-bold text-neutral-900 text-lg md:text-xl tracking-tight whitespace-nowrap group-hover/item:scale-105 transition-transform">
                              {item.price}
                            </span>
                            {/* Petit badge décoratif */}
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 group-hover/item:bg-neutral-900 transition-colors"></div>
                          </div>
                        </div>
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
                        <div className="flex gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditModal({
                              type: 'service-item',
                              data: item,
                              sectionId: section.id
                            })}
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
                        </div>
                      )}
                    </div>
                  ))}

                  {isAdmin && (
                    <button
                      onClick={() => setEditModal({
                        type: 'service-item',
                        sectionId: section.id
                      })}
                      className="w-full mt-4 py-2.5 border-2 border-dashed border-harmonie-300 text-harmonie-600 rounded-xl hover:border-harmonie-500 hover:text-harmonie-800 hover:bg-harmonie-50/30 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus size={16} />
                      Ajouter un service
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl md:rounded-3xl p-6 md:p-16 text-white shadow-2xl relative overflow-hidden group">
          {/* Effet de lueur subtile */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative z-10">
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
      </div>

      {/* Modal d'édition */}
      {editModal && (
        <AdminEditModal
          type={editModal.type as any}
          data={editModal.data}
          onSave={
            editModal.type === 'service-section' ? handleSaveServiceSection :
            editModal.type === 'service-item' ? handleSaveServiceItem :
            editModal.type === 'background' ? handleSaveBackground :
            () => {}
          }
          onClose={() => setEditModal(null)}
        />
      )}

    </section>
  );
};

export default Services;