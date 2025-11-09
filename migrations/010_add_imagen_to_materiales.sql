-- Migración para agregar campo de imagen a materiales

-- =====================================================
-- TABLA: materiales - Agregar campo imagen_url
-- =====================================================

-- Agregar campo para almacenar URL de imagen subida a Supabase Storage
ALTER TABLE public.materiales 
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Comentario en el campo
COMMENT ON COLUMN public.materiales.imagen_url IS 'URL de la imagen subida a Supabase Storage';

-- =====================================================
-- STORAGE: Configurar bucket para imágenes de materiales
-- =====================================================

-- IMPORTANTE: Además de ejecutar este SQL, debes configurar el bucket manualmente:
--
-- OPCIÓN 1 - Configuración Manual (Recomendado):
-- 1. Ve a Storage en el panel de Supabase
-- 2. Crea un nuevo bucket llamado 'materiales'
-- 3. Marca la opción "Public bucket" para permitir acceso público a las imágenes
-- 4. Las políticas se crearán automáticamente abajo
--
-- OPCIÓN 2 - Solo SQL (puede requerir permisos adicionales):
-- Ejecuta el SQL a continuación para crear el bucket programáticamente

-- Crear bucket público para materiales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materiales', 
  'materiales', 
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Política para permitir lectura pública de todas las imágenes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'materiales');

-- Política para permitir subida de imágenes (sin autenticación para simplificar)
-- NOTA: En producción, considera restringir esto solo a usuarios autenticados
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;
CREATE POLICY "Enable insert for all users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'materiales');

-- Política para permitir actualización de imágenes
DROP POLICY IF EXISTS "Enable update for all users" ON storage.objects;
CREATE POLICY "Enable update for all users"
ON storage.objects FOR UPDATE
USING (bucket_id = 'materiales')
WITH CHECK (bucket_id = 'materiales');

-- Política para permitir eliminación de imágenes
DROP POLICY IF EXISTS "Enable delete for all users" ON storage.objects;
CREATE POLICY "Enable delete for all users"
ON storage.objects FOR DELETE
USING (bucket_id = 'materiales');
