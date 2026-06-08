-- Storage policies for profiles bucket

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Allow authenticated users to update their own avatars
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- Allow public read access to avatars
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');
