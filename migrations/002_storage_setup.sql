-- =====================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- =====================================================

-- Crear bucket para imágenes de discos/herramientas
INSERT INTO storage.buckets (id, name, public)
VALUES ('discos-images', 'discos-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Permitir lectura pública de imágenes
CREATE POLICY "Acceso público a imágenes de discos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'discos-images');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'discos-images');

-- Permitir actualización a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'discos-images');

-- Permitir eliminación a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'discos-images');

-- =====================================================
-- NOTAS DE USO
-- =====================================================
-- URL pública de las imágenes:
-- https://vavlehrkorioncfloedn.supabase.co/storage/v1/object/public/discos-images/{filename}
--
-- Para subir imágenes desde la aplicación:
-- await supabase.storage.from('discos-images').upload('path/filename.jpg', file)
