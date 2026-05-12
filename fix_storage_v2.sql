-- Liberar geral para teste
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'store-products');

DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
CREATE POLICY "Permitir Upload Logado" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-products');

DROP POLICY IF EXISTS "Admin All" ON storage.objects;
CREATE POLICY "Permitir Tudo Logado" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'store-products');
