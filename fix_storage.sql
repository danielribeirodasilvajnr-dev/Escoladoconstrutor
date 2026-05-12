-- Script de Reparo do Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-products', 'store-products', true) 
ON CONFLICT (id) DO NOTHING;

-- Limpar e recriar políticas
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'store-products');

DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-products');

DROP POLICY IF EXISTS "Admin All" ON storage.objects;
CREATE POLICY "Admin All" ON storage.objects FOR ALL USING (bucket_id = 'store-products');
