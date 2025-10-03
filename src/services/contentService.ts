import { supabase } from '../lib/supabase';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  price: string;
  order_index: number;
}

export interface Service {
  id: string;
  title: string;
  icon: string;
  order_index: number;
}

export interface ServiceItem {
  id: string;
  service_id: string;
  label: string;
  price: string;
  order_index: number;
}

export interface PortfolioItem {
  id: string;
  url: string;
  title: string;
  description: string;
  detailed_description: string;
  alt: string;
  show_on_home: boolean;
  order_index: number;
}

export interface AboutContent {
  id: string;
  section_key: string;
  title: string;
  content: string;
  image_url: string;
  order_index: number;
}

// Promotions
export const getPromotions = async () => {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const createPromotion = async (promotion: Omit<Promotion, 'id'>) => {
  const { data, error } = await supabase
    .from('promotions')
    .insert(promotion)
    .select()
    .single();

  if (error) throw error;
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
  return data;
};

export const deletePromotion = async (id: string) => {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Services
export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const createService = async (service: Omit<Service, 'id'>) => {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();

  if (error) throw error;
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
  return data;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Service Items
export const getServiceItems = async (serviceId?: string) => {
  let query = supabase
    .from('service_items')
    .select('*')
    .order('order_index');

  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const createServiceItem = async (item: Omit<ServiceItem, 'id'>) => {
  const { data, error } = await supabase
    .from('service_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceItem = async (id: string, item: Partial<ServiceItem>) => {
  const { data, error } = await supabase
    .from('service_items')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteServiceItem = async (id: string) => {
  const { error } = await supabase
    .from('service_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Portfolio Items
export const getPortfolioItems = async () => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const createPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
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
  return data;
};

export const deletePortfolioItem = async (id: string) => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// About Content
export const getAboutContent = async () => {
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const upsertAboutContent = async (content: Omit<AboutContent, 'id'>) => {
  const { data, error } = await supabase
    .from('about_content')
    .upsert(content, { onConflict: 'section_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
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
