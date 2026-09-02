-- Storage bucket and policies for SmartHR CV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read from cvs'
  ) THEN
    CREATE POLICY "Allow public read from cvs" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'cvs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public uploads to cvs'
  ) THEN
    CREATE POLICY "Allow public uploads to cvs" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'cvs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow update cvs'
  ) THEN
    CREATE POLICY "Allow update cvs" ON storage.objects FOR UPDATE TO authenticated, anon USING (bucket_id = 'cvs');
  END IF;
END $$;
