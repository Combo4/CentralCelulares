-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create brands table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phones table
CREATE TABLE public.phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    model TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    storage_options TEXT[] DEFAULT '{}',
    display_size TEXT,
    processor TEXT,
    ram TEXT,
    camera TEXT,
    battery TEXT,
    release_year INTEGER,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    discount_amount DECIMAL(10,2),
    banner_image TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_phones junction table
CREATE TABLE public.campaign_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    phone_id UUID REFERENCES public.phones(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, phone_id)
);

-- Create analytics_events table for real tracking
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    phone_id UUID REFERENCES public.phones(id) ON DELETE SET NULL,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for WhatsApp number etc.
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default WhatsApp setting
INSERT INTO public.settings (key, value) VALUES ('whatsapp_number', '+1234567890');

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view published phones, brands, active campaigns)
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Anyone can view published phones" ON public.phones FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view active campaigns" ON public.campaigns FOR SELECT USING (is_active = true AND now() BETWEEN start_date AND end_date);
CREATE POLICY "Anyone can view campaign phones" ON public.campaign_phones FOR SELECT USING (true);
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);

-- Analytics events - anyone can insert (for tracking), only admins can read
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for full CRUD
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all phones" ON public.phones FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert phones" ON public.phones FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update phones" ON public.phones FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete phones" ON public.phones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage campaign phones" ON public.campaign_phones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_phones_updated_at
    BEFORE UPDATE ON public.phones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment view/click counts
CREATE OR REPLACE FUNCTION public.increment_phone_count(phone_uuid UUID, count_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF count_type = 'view' THEN
        UPDATE public.phones SET view_count = view_count + 1 WHERE id = phone_uuid;
    ELSIF count_type = 'click' THEN
        UPDATE public.phones SET click_count = click_count + 1 WHERE id = phone_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert mock brands
INSERT INTO public.brands (name, logo_url) VALUES
('Apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'),
('Samsung', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg'),
('Google', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'),
('OnePlus', 'https://upload.wikimedia.org/wikipedia/commons/d/d6/OnePlus_logo.svg'),
('Xiaomi', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg');

-- Insert mock phones
INSERT INTO public.phones (brand_id, model, price, sale_price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images, is_featured) 
SELECT 
    b.id,
    'iPhone 15 Pro Max',
    1199.00,
    NULL,
    ARRAY['256GB', '512GB', '1TB'],
    '6.7"',
    'A17 Pro',
    '8GB',
    '48MP + 12MP + 12MP',
    '4422mAh',
    2023,
    'The most powerful iPhone ever with titanium design and advanced camera system.',
    ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'],
    true
FROM public.brands b WHERE b.name = 'Apple';

INSERT INTO public.phones (brand_id, model, price, sale_price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images, is_featured)
SELECT 
    b.id,
    'Galaxy S24 Ultra',
    1299.00,
    1199.00,
    ARRAY['256GB', '512GB', '1TB'],
    '6.8"',
    'Snapdragon 8 Gen 3',
    '12GB',
    '200MP + 12MP + 50MP + 10MP',
    '5000mAh',
    2024,
    'The ultimate Galaxy experience with S Pen and AI features.',
    ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'],
    true
FROM public.brands b WHERE b.name = 'Samsung';

INSERT INTO public.phones (brand_id, model, price, sale_price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images)
SELECT 
    b.id,
    'Pixel 8 Pro',
    999.00,
    899.00,
    ARRAY['128GB', '256GB', '512GB'],
    '6.7"',
    'Tensor G3',
    '12GB',
    '50MP + 48MP + 48MP',
    '5050mAh',
    2023,
    'The best of Google AI in a stunning phone.',
    ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800']
FROM public.brands b WHERE b.name = 'Google';

INSERT INTO public.phones (brand_id, model, price, sale_price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images)
SELECT 
    b.id,
    'OnePlus 12',
    799.00,
    NULL,
    ARRAY['256GB', '512GB'],
    '6.82"',
    'Snapdragon 8 Gen 3',
    '16GB',
    '50MP + 48MP + 64MP',
    '5400mAh',
    2024,
    'Flagship killer with Hasselblad camera.',
    ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800']
FROM public.brands b WHERE b.name = 'OnePlus';

INSERT INTO public.phones (brand_id, model, price, sale_price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images, is_featured)
SELECT 
    b.id,
    'Xiaomi 14 Ultra',
    1299.00,
    1099.00,
    ARRAY['256GB', '512GB'],
    '6.73"',
    'Snapdragon 8 Gen 3',
    '16GB',
    '50MP + 50MP + 50MP + 50MP',
    '5000mAh',
    2024,
    'Leica optics meet flagship performance.',
    ARRAY['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800'],
    true
FROM public.brands b WHERE b.name = 'Xiaomi';

-- Add more phones for variety
INSERT INTO public.phones (brand_id, model, price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images)
SELECT b.id, 'iPhone 15', 799.00, ARRAY['128GB', '256GB', '512GB'], '6.1"', 'A16 Bionic', '6GB', '48MP + 12MP', '3349mAh', 2023, 'Dynamic Island comes to iPhone 15.', ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800']
FROM public.brands b WHERE b.name = 'Apple';

INSERT INTO public.phones (brand_id, model, price, storage_options, display_size, processor, ram, camera, battery, release_year, description, images)
SELECT b.id, 'Galaxy A54 5G', 449.00, ARRAY['128GB', '256GB'], '6.4"', 'Exynos 1380', '8GB', '50MP + 12MP + 5MP', '5000mAh', 2023, 'Awesome is for everyone.', ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800']
FROM public.brands b WHERE b.name = 'Samsung';

-- Create a sample campaign
INSERT INTO public.campaigns (name, description, discount_percent, start_date, end_date, is_active)
VALUES ('New Year Sale', 'Start the year with amazing deals on top smartphones!', 15, now(), now() + interval '30 days', true);