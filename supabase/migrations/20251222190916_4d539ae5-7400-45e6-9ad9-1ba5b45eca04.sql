-- Create storage bucket for phone images
INSERT INTO storage.buckets (id, name, public) VALUES ('phone-images', 'phone-images', true);

-- Allow anyone to view phone images
CREATE POLICY "Anyone can view phone images"
ON storage.objects FOR SELECT
USING (bucket_id = 'phone-images');

-- Allow admins to upload phone images
CREATE POLICY "Admins can upload phone images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'phone-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update phone images
CREATE POLICY "Admins can update phone images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'phone-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete phone images
CREATE POLICY "Admins can delete phone images"
ON storage.objects FOR DELETE
USING (bucket_id = 'phone-images' AND has_role(auth.uid(), 'admin'::app_role));