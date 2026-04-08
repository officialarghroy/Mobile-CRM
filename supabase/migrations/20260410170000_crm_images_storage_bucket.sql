-- Public bucket for lead note images (paths like leads/{leadId}/updates/...).

INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-images', 'crm-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "CRM images public read" ON storage.objects;
CREATE POLICY "CRM images public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'crm-images');

DROP POLICY IF EXISTS "CRM images authenticated upload" ON storage.objects;
CREATE POLICY "CRM images authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crm-images');

DROP POLICY IF EXISTS "CRM images authenticated update" ON storage.objects;
CREATE POLICY "CRM images authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crm-images')
WITH CHECK (bucket_id = 'crm-images');

DROP POLICY IF EXISTS "CRM images authenticated delete" ON storage.objects;
CREATE POLICY "CRM images authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crm-images');
