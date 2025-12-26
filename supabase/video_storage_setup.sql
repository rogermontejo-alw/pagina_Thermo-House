-- Create a new bucket for videos and images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to assets
CREATE POLICY "Public Assets Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'site-assets' AND
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )
);

-- Policy to allow admins to delete assets
CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'site-assets' AND
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )
);
