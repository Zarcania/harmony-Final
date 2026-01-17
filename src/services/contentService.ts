import { supabase } from '../lib/supabase';
import { callRpc } from '../api/supa';
import { cache } from '../lib/cache';
import { BusinessBreak, BreakFormData } from '../types/booking';

const log = (url: string, status: number, body?: unknown) => {
  const prefix = '[API]';
  if (status >= 200 && status < 300) console.info(prefix, status, url);
  else console.warn(prefix, status, url, body);
};

export interface Promotion {
  id: string;
  title: string;
  description: string;
  price: string;
  // champs UI optionnels non stockés directement
  original_price?: string | null;
  badge?: string | null;
  icon?: string | null;
  // Nouveau: prestations liées à la promotion (UUIDs de service_items)
  service_item_ids?: string[] | null;
  order_index: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Service {
  id: string;
  title: string;
  icon: string;
  order_index: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ServiceItem {
  id: string;
  service_id: string;
  label: string;
  price: string;
  description?: string | null;
  duration?: string | null;
  duration_minutes?: number | null;
  benefits?: string[] | null;
  order_index: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PortfolioItem {
  id: string;
  url: string;
  title: string;
  description: string;
  detailed_description?: string | null;
  alt: string;
  category: string;
  show_on_home?: boolean | null;
  order_index: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AboutContent {
  id: string;
  section_key: string;
  title?: string | null;
  content?: string | null;
  image_url?: string | null;
  order_index: number | null;
  updated_at?: string | null;
}

export interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  service_type: string;
  is_published: boolean;
  order_index: number;
  created_at?: string | null;
  updated_at?: string | null;
}

// Promotions
export const getPromotions = async () => {
  return cache.wrap<Promotion[]>(
    'promotions:all',
    async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createPromotion = async (promotion: Omit<Promotion, 'id'>) => {
  const { data, error } = await supabase
    .from('promotions')
    .insert(promotion)
    .select()
    .single();

  if (error) throw error;
  cache.del('promotions:*');
  return data;
};

export const updatePromotion = async (id: string, promotion: Partial<Promotion>) => {
  const { data, error } = await supabase
    .from('promotions')
    .update({ ...promotion, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  cache.del('promotions:*');
  return data;
};

export const deletePromotion = async (id: string) => {
  // Utilise un RPC SECURITY DEFINER côté DB pour bypass RLS tout en vérifiant admin
  // Avantage: plus de 403 même si des policies manquent; la fonction applique public.is_admin().
  await callRpc('delete_promotion', { p_id: id });
  cache.del('promotions:*');
};

// Services
export const getServices = async () => {
  return cache.wrap<Service[]>(
    'services:all',
    async () => {
      const { data, error, status } = await supabase
        .from('services')
        .select('*')
        .order('order_index');
      log('table:services', status as number, error);
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createService = async (service: Omit<Service, 'id'>) => {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();

  if (error) throw error;
  cache.del('services:*');
  return data;
};

export const updateService = async (id: string, service: Partial<Service>) => {
  const { data, error } = await supabase
    .from('services')
    .update({ ...service, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  cache.del('services:*');
  return data;
};

export const deleteService = async (id: string) => {
  // Suppression sécurisée via RPC (vérifie catégorie vide et admin)
  await callRpc('delete_service', { p_id: id });
  cache.del('services:*');
};

// Service Items
export const getServiceItems = async (serviceId?: string, bypassCache = false) => {
  const key = serviceId ? `service_items:by_service:${serviceId}` : 'service_items:all'
  
  // Si bypassCache est true, on skip le cache complètement
  if (bypassCache) {
    let query = supabase
      .from('service_items')
      .select('*')
      .order('order_index');
    if (serviceId) query = query.eq('service_id', serviceId);
    const { data, error, status } = await query;
    log('table:service_items', status as number, error);
    if (error) throw error;
    return data || [];
  }
  
  return cache.wrap<ServiceItem[]>(
    key,
    async () => {
      let query = supabase
        .from('service_items')
        .select('*')
        .order('order_index');
      if (serviceId) query = query.eq('service_id', serviceId);
      const { data, error, status } = await query;
      log('table:service_items', status as number, error);
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createServiceItem = async (item: Omit<ServiceItem, 'id'>) => {
  // Ne jamais envoyer duration_minutes (colonne générée en base)
  const payload = { ...(item as Record<string, unknown>) };
  delete (payload as Record<string, unknown>).duration_minutes;
  const { data, error } = await supabase
    .from('service_items')
    .insert(payload as Omit<ServiceItem, 'id' | 'duration_minutes'>)
    .select()
    .single();

  if (error) throw error;
  cache.del('service_items:*');
  return data;
};

export const updateServiceItem = async (id: string, item: Partial<ServiceItem>) => {
  // Retirer duration_minutes du payload d'update
  const rest = { ...(item as Record<string, unknown>) };
  delete (rest as Record<string, unknown>).duration_minutes;
  
  const { data, error } = await supabase
    .from('service_items')
    .update({ ...(rest as Partial<ServiceItem>), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Vider TOUS les caches liés (mémoire + forcer invalidation)
  cache.del('service_items:*');
  cache.del('services:*');
  
  return data;
};

export const deleteServiceItem = async (id: string) => {
  // Tentative via RPC (suppression sécurisée avec vérification RDV)
  try {
    await callRpc('delete_service_item', { p_id: id });
  } catch (rpcError) {
    // Si RPC n'existe pas ou échoue, fallback sur DELETE direct (RLS vérifiera admin)
    console.warn('RPC delete_service_item failed, trying direct delete:', rpcError);
    const { error } = await supabase
      .from('service_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Vider les caches
  cache.del('service_items:*');
  cache.del('services:*');
};

// Portfolio Categories
export const getPortfolioCategories = async () => {
  return cache.wrap(
    'portfolio_categories:all',
    async () => {
      const { data, error } = await supabase
        .from('portfolio_categories')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createPortfolioCategory = async (name: string, orderIndex: number) => {
  const { data, error } = await supabase
    .from('portfolio_categories')
    .insert({ name, order_index: orderIndex })
    .select()
    .single();

  if (error) throw error;
  cache.del('portfolio_categories:*');
  return data;
};

export const updatePortfolioCategory = async (id: string, name: string, orderIndex: number) => {
  const { data, error } = await supabase
    .from('portfolio_categories')
    .update({ name, order_index: orderIndex, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  cache.del('portfolio_categories:*');
  return data;
};

export const deletePortfolioCategory = async (id: string) => {
  const { error } = await supabase
    .from('portfolio_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  cache.del('portfolio_categories:*');
};

// Portfolio Items
export const getPortfolioItems = async () => {
  return cache.wrap<PortfolioItem[]>(
    'portfolio_items:all',
    async () => {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  cache.del('portfolio_items:*');
  return data;
};

export const updatePortfolioItem = async (id: string, item: Partial<PortfolioItem>) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  cache.del('portfolio_items:*');
  return data;
};

export const deletePortfolioItem = async (id: string) => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  cache.del('portfolio_items:*');
};

// About Content
export const getAboutContent = async () => {
  return cache.wrap<AboutContent[]>(
    'about_content:all',
    async () => {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const upsertAboutContent = async (content: Omit<AboutContent, 'id'>) => {
  const { data, error } = await supabase
    .from('about_content')
    .upsert(content, { onConflict: 'section_key' })
    .select()
    .single();

  if (error) throw error;
  cache.del('about_content:*');
  return data;
};

// Reviews
export const getReviews = async (publishedOnly: boolean = true) => {
  const key = publishedOnly ? 'reviews:published' : 'reviews:all'
  return cache.wrap<Review[]>(
    key,
    async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('order_index');
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    5 * 60_000
  );
};

export const createReview = async (review: Omit<Review, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  cache.del('reviews:*');
  return data;
};

export const updateReview = async (id: string, review: Partial<Review>) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ ...review, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  cache.del('reviews:*');
  return data;
};

export const deleteReview = async (id: string) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
  cache.del('reviews:*');
};

// Image Upload
export const uploadImage = async (file: File, folder: string = 'portfolio') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
};

// ==================== Business Breaks (Pauses) ====================

export const getBusinessBreaks = async (startDate?: string, endDate?: string): Promise<BusinessBreak[]> => {
  let query = supabase
    .from('admin_breaks')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (startDate) query = query.gte('end_date', startDate);
  if (endDate) query = query.lte('start_date', endDate);
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching business breaks:', error);
    throw error;
  }
  return data || [];
};

export const createBusinessBreak = async (breakData: BreakFormData): Promise<BusinessBreak> => {
  const { data, error } = await supabase
    .from('admin_breaks')
    .insert({
      start_date: breakData.start_date,
      end_date: breakData.end_date,
      start_time: breakData.start_time || null,
      end_time: breakData.end_time || null,
      reason: breakData.reason || null
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating business break:', error);
    throw error;
  }
  return data;
};

export const updateBusinessBreak = async (id: string, breakData: Partial<BreakFormData>): Promise<BusinessBreak> => {
  const updateData: Record<string, unknown> = {};
  if (breakData.start_date !== undefined) updateData.start_date = breakData.start_date;
  if (breakData.end_date !== undefined) updateData.end_date = breakData.end_date;
  if (breakData.start_time !== undefined) updateData.start_time = breakData.start_time || null;
  if (breakData.end_time !== undefined) updateData.end_time = breakData.end_time || null;
  if (breakData.reason !== undefined) updateData.reason = breakData.reason || null;

  const { data, error } = await supabase
    .from('admin_breaks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating business break:', error);
    throw error;
  }
  return data;
};

export const deleteBusinessBreak = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('admin_breaks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting business break:', error);
    throw error;
  }
};

export const checkBreakConflicts = async (breakData: BreakFormData): Promise<Array<{ date: string; time: string; clientName: string; service: string }>> => {
  // Récupère tous les rendez-vous dans la plage de dates de la pause
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('preferred_date, preferred_time, client_name, service_name, duration_minutes')
    .gte('preferred_date', breakData.start_date)
    .lte('preferred_date', breakData.end_date)
    .in('status', ['confirmed', 'pending']);

  if (error) {
    console.error('Error checking break conflicts:', error);
    throw error;
  }

  if (!bookings || bookings.length === 0) return [];

  // Si pas d'horaires spécifiés dans la pause, toute la journée est bloquée
  if (!breakData.start_time || !breakData.end_time) {
    return bookings.map(b => ({
      date: b.preferred_date,
      time: b.preferred_time,
      clientName: b.client_name,
      service: b.service_name
    }));
  }

  // Fonction helper pour convertir HH:MM en minutes
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Sinon, vérifier les chevauchements horaires
  const breakStart = timeToMinutes(breakData.start_time);
  const breakEnd = timeToMinutes(breakData.end_time);

  const conflicts = bookings.filter(b => {
    const bookingStart = timeToMinutes(b.preferred_time);
    const bookingEnd = bookingStart + (b.duration_minutes || 60);
    
    // Vérifie si les plages horaires se chevauchent
    return !(bookingEnd <= breakStart || bookingStart >= breakEnd);
  });

  return conflicts.map(b => ({
    date: b.preferred_date,
    time: b.preferred_time,
    clientName: b.client_name,
    service: b.service_name
  }));
};

