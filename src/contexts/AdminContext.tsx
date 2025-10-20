import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, checkIsAdmin } from '../lib/supabase';
import { getServices, getServiceItems } from '../services/contentService';

interface PortfolioImage {
  id: string;
  url: string;
  alt: string;
  title: string;
  description: string;
  detailedDescription: string;
  showOnHome: boolean;
  category?: string;
}

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

interface AdminContextType {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  portfolioImages: PortfolioImage[];
  updatePortfolioImage: (id: string, updates: Partial<PortfolioImage>) => void;
  addPortfolioImage: (image: Omit<PortfolioImage, 'id'>) => void;
  deletePortfolioImage: (id: string) => void;
  serviceSections: ServiceSection[];
  updateServiceSection: (id: string, updates: Partial<ServiceSection>) => void;
  updateServiceItem: (sectionId: string, itemId: string, updates: Partial<ServiceItem>) => void;
  addServiceItem: (sectionId: string, item: Omit<ServiceItem, 'id'>) => void;
  deleteServiceItem: (sectionId: string, itemId: string) => void;
  addServiceSection: (section: { title: string; icon: string }) => void;
  moveServiceSection: (id: string, direction: 'up' | 'down') => void;
  prestationsBackgroundImage: string;
  setPrestationsBackgroundImage: (url: string) => void;
  showPrestationsBackground: boolean;
  setShowPrestationsBackground: (show: boolean) => void;
  servicesError?: string | null;
  reloadServices: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // État d'erreur auth optionnel (peut être exposé au besoin)
  const [prestationsBackgroundImage, setPrestationsBackgroundImage] = useState('');
  const [showPrestationsBackground, setShowPrestationsBackground] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([
    {
      id: '1',
      url: "/image1.jpeg",
      alt: "Extensions de cils volume russe - Harmonie Cils",
      title: "Volume Russe",
      description: "Extensions volume russe pour un regard intense et glamour",
      detailedDescription: "Pose d'extensions volume russe réalisée par Harmonie Cils. Technique experte pour un volume spectaculaire et un regard captivant.",
      showOnHome: true
    },
    {
      id: '2',
      url: "/image2.jpeg",
      alt: "Extensions de cils naturelles - Harmonie Cils",
      title: "Regard Naturel",
      description: "Extensions pour un effet naturel et élégant",
      detailedDescription: "Pose d'extensions de cils pour un effet naturel parfait. Travail minutieux pour sublimer le regard en douceur.",
      showOnHome: true
    },
    {
      id: '3',
      url: "/image3.jpeg",
      alt: "Extensions de cils volume - Harmonie Cils",
      title: "Volume Parfait",
      description: "Extensions volume pour un regard magnifique",
      detailedDescription: "Réalisation d'extensions de cils volume par Harmonie Cils. Technique professionnelle pour un résultat exceptionnel.",
      showOnHome: true
    },
    {
      id: '4',
      url: "/image12.jpeg",
      alt: "Extensions de cils professionnelles - Harmonie Cils",
      title: "Technique Experte",
      description: "Extensions réalisées avec expertise et précision",
      detailedDescription: "Démonstration du savoir-faire d'Harmonie Cils avec cette pose d'extensions parfaitement réalisée.",
      showOnHome: true
    },
    {
      id: '5',
      url: "/image13.jpeg",
      alt: "Extensions de cils élégantes - Harmonie Cils",
      title: "Élégance Pure",
      description: "Extensions pour un look sophistiqué et raffiné",
      detailedDescription: "Pose d'extensions de cils réalisée avec soin pour un résultat élégant et sophistiqué.",
      showOnHome: true
    },
    {
      id: '6',
      url: "/image1.jpeg",
      alt: "Réalisation Harmonie Cils",
      title: "Savoir-faire",
      description: "Démonstration de notre expertise professionnelle",
      detailedDescription: "Exemple parfait du travail minutieux et professionnel réalisé chez Harmonie Cils.",
      showOnHome: true
    },
    {
      id: '7',
      url: "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop",
      alt: "Soins des cils",
      title: "Soins",
      description: "Entretien et soin de vos cils naturels",
      detailedDescription: "Soin nourrissant et fortifiant pour vos cils naturels. Traitement revitalisant qui améliore la santé et la beauté de vos cils.",
      showOnHome: false
    },
    {
      id: '8',
      url: "https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop",
      alt: "Extensions volume intense",
      title: "Volume Intense",
      description: "Maximum de volume pour un regard dramatique",
      detailedDescription: "Volume maximum pour un effet spectaculaire. Technique experte pour les clientes souhaitant un regard très intense et glamour.",
      showOnHome: false
    },
    {
      id: '9',
      url: "https://images.pexels.com/photos/3993543/pexels-photo-3993543.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop",
      alt: "Regard sublimé",
      title: "Regard Sublimé",
      description: "Résultat final parfait",
      detailedDescription: "Résultat final d'une pose d'extensions parfaitement réalisée. Démonstration de l'excellence de notre savoir-faire.",
      showOnHome: false
    }
  ]);

  const [serviceSections, setServiceSections] = useState<ServiceSection[]>([
    {
      id: '1',
      title: "Épilation au fil",
      icon: "Scissors",
      items: [
        { id: '1-1', label: "Sourcils", price: "12€" },
        { id: '1-2', label: "Lèvre", price: "8€" },
        { id: '1-3', label: "Menton", price: "7€" }
      ]
    },
    {
      id: '2',
      title: "Formules Épilation",
      icon: "Heart",
      items: [
        { id: '2-1', label: "Sourcils & Lèvre", price: "18€" },
        { id: '2-2', label: "Sourcils, Lèvre & Menton", price: "25€" }
      ]
    },
    {
      id: '3',
      title: "Poses & Volumes",
      icon: "Eye",
      items: [
        { id: '3-1', label: "Pose cil à cil", price: "55€" },
        { id: '3-2', label: "Pose volume mixte", price: "65€" },
        { id: '3-3', label: "Pose volume russe", price: "75€" },
        { id: '3-4', label: "Pose volume russe intense", price: "80€" }
      ]
    },
    {
      id: '4',
      title: "Remplissages",
      icon: "Sparkles",
      items: [
        { id: '4-1', label: "Remplissage cil à cil", price: "40€" },
        { id: '4-2', label: "Remplissage mixte", price: "50€" },
        { id: '4-3', label: "Remplissage russe", price: "60€" },
        { id: '4-4', label: "Dépose", price: "10€" }
      ]
    },
    {
      id: '5',
      title: "Rehaussement",
      icon: "Eye",
      items: [
        { id: '5-1', label: "Rehaussement de cils", price: "40€" },
        { id: '5-2', label: "Rehaussement & teinture", price: "45€" },
        { id: '5-3', label: "Teinture de cils", price: "25€" }
      ]
    }
  ]);

  const updatePortfolioImage = (id: string, updates: Partial<PortfolioImage>) => {
    setPortfolioImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  const addPortfolioImage = (image: Omit<PortfolioImage, 'id'>) => {
    const newImage = { ...image, id: Date.now().toString() };
    setPortfolioImages(prev => [...prev, newImage]);
  };

  const deletePortfolioImage = (id: string) => {
    setPortfolioImages(prev => prev.filter(img => img.id !== id));
  };

  const updateServiceSection = (id: string, updates: Partial<ServiceSection>) => {
    setServiceSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const updateServiceItem = (sectionId: string, itemId: string, updates: Partial<ServiceItem>) => {
    setServiceSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { 
            ...section, 
            items: section.items.map(item => 
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : section
    ));
  };

  const addServiceItem = (sectionId: string, item: Omit<ServiceItem, 'id'>) => {
    const newItem = { ...item, id: `${sectionId}-${Date.now()}` };
    setServiceSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, items: [...section.items, newItem] }
        : section
    ));
  };

  const deleteServiceItem = (sectionId: string, itemId: string) => {
    setServiceSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, items: section.items.filter(item => item.id !== itemId) }
        : section
    ));
  };

  const addServiceSection = (section: { title: string; icon: string }) => {
    const newSection: ServiceSection = {
      id: `${Date.now()}`,
      title: section.title,
      icon: section.icon,
      items: []
    };
    setServiceSections(prev => [...prev, newSection]);
  };

  const moveServiceSection = (id: string, direction: 'up' | 'down') => {
    setServiceSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const isAdminUser = await checkIsAdmin();
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const isAdminUser = await checkIsAdmin();
          setIsAdmin(isAdminUser);
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const reloadServices = React.useCallback(async () => {
    try {
      setServicesError(null);
      const services = await getServices();
      const sectionsWithItems: ServiceSection[] = await Promise.all(
        services.map(async (service) => {
          const items = await getServiceItems(service.id);
          return {
            id: service.id,
            title: service.title,
            icon: service.icon,
            items: items.map((item) => ({
              id: item.id,
              label: item.label,
              price: item.price,
              duration: item.duration,
              description: item.description
            }))
          };
        })
      );
      if (sectionsWithItems.length > 0) {
        setServiceSections(sectionsWithItems);
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message || 'Erreur lors du chargement des prestations';
      setServicesError(msg);
      console.error('Error loading services:', error);
    }
  }, []);

  useEffect(() => { reloadServices(); }, [reloadServices]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const services = await getServices();
        const sectionsWithItems: ServiceSection[] = await Promise.all(
          services.map(async (service) => {
            const items = await getServiceItems(service.id);
            return {
              id: service.id,
              title: service.title,
              icon: service.icon,
              items: items.map((item) => ({
                id: item.id,
                label: item.label,
                price: item.price,
                duration: item.duration,
                description: item.description
              }))
            };
          })
        );
        if (sectionsWithItems.length > 0) {
          setServiceSections(sectionsWithItems);
        }
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };

    loadServices();
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('login error', error);
        return { ok: false, message: error.message };
      }

      const { data: s } = await supabase.auth.getSession();
      console.log('session', s);

      const isAdminUser = await checkIsAdmin();
      if (!isAdminUser) {
        await supabase.auth.signOut();
        const msg = 'Accès refusé: vous n\'êtes pas administrateur.';
        return { ok: false, message: msg };
      }

      // Test réseau post-login (temporaire)
      const { data: hours, error: e2 } = await supabase.from('business_hours').select('*').limit(1);
      console.log('hours', { hours, e2 });

      setIsAdmin(true);
      return { ok: true };
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Erreur inconnue';
      console.error('login exception', e);
      return { ok: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AdminContext.Provider value={{
      isAdmin,
      setIsAdmin,
      login,
      logout,
      isLoading,
      portfolioImages,
      updatePortfolioImage,
      addPortfolioImage,
      deletePortfolioImage,
      serviceSections,
      updateServiceSection,
      updateServiceItem,
      addServiceItem,
      deleteServiceItem,
      addServiceSection,
      moveServiceSection,
      prestationsBackgroundImage,
      setPrestationsBackgroundImage,
      showPrestationsBackground,
      setShowPrestationsBackground,
      servicesError,
      reloadServices,
    }}>
      {children}
    </AdminContext.Provider>
  );
};