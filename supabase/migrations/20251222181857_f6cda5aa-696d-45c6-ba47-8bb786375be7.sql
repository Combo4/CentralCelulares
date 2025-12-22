-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix search_path for increment_phone_count function
CREATE OR REPLACE FUNCTION public.increment_phone_count(phone_uuid UUID, count_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF count_type = 'view' THEN
        UPDATE public.phones SET view_count = view_count + 1 WHERE id = phone_uuid;
    ELSIF count_type = 'click' THEN
        UPDATE public.phones SET click_count = click_count + 1 WHERE id = phone_uuid;
    END IF;
END;
$$;