export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface Phone {
  id: string;
  brand_id: string;
  model: string;
  price: number;
  sale_price: number | null;
  storage_options: string[];
  display_size: string | null;
  processor: string | null;
  ram: string | null;
  camera: string | null;
  battery: string | null;
  release_year: number | null;
  description: string | null;
  images: string[];
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface CampaignPhone {
  id: string;
  campaign_id: string;
  phone_id: string;
  created_at: string;
  phone?: Phone;
  campaign?: Campaign;
}

export interface AnalyticsEvent {
  id: string;
  event_type: 'page_view' | 'product_view' | 'product_click' | 'whatsapp_click';
  phone_id: string | null;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface PhoneWithBrand extends Phone {
  brand: Brand;
}

export interface PhoneFilters {
  search?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  storage?: string[];
  releaseYear?: number[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  whatsappClicks: number;
  ctr: number;
  topPhones: { phone: Phone; views: number; clicks: number }[];
  dailyStats: { date: string; views: number; clicks: number; whatsapp: number }[];
}