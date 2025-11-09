# Configuración de Storage para Imágenes de Materiales

## 📋 Pasos para Configurar

### 1️⃣ Ejecutar Migración SQL
Ejecuta el archivo `010_add_imagen_to_materiales.sql` en el SQL Editor de Supabase para:
- Agregar el campo `imagen_url` a la tabla `materiales`
- Crear el bucket de storage
- Configurar las políticas de acceso

### 2️⃣ Verificar/Crear Bucket Manualmente (Recomendado)

Si el SQL no crea el bucket automáticamente, sigue estos pasos:

1. Ve al panel de **Storage** en Supabase
2. Haz clic en **"New bucket"**
3. Configura el bucket con estos valores:
   - **Name**: `materiales`
   - **Public bucket**: ✅ **Activado** (importante para mostrar las imágenes)
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

4. Haz clic en **"Create bucket"**

### 3️⃣ Verificar Políticas de Storage

Las políticas deberían crearse automáticamente con el SQL. Verifica en **Storage > Policies** que existan:

- ✅ **Public Access** - Permite lectura pública
- ✅ **Enable insert for all users** - Permite subir imágenes
- ✅ **Enable update for all users** - Permite actualizar imágenes
- ✅ **Enable delete for all users** - Permite eliminar imágenes

## ✅ Verificación

Para verificar que todo funciona:

1. Ve a **Inventario** > **Nuevo Material**
2. Llena el formulario y selecciona una imagen
3. Guarda el material
4. Verifica que la imagen se muestre correctamente en la lista de materiales

## 🔒 Seguridad (Opcional)

Para producción, considera modificar las políticas para requerir autenticación:

```sql
-- Solo usuarios autenticados pueden subir
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materiales');
```

## 📝 Notas

- Las imágenes se almacenan en Supabase Storage (no en la base de datos)
- Solo se guarda la URL de la imagen en el campo `imagen_url`
- Tamaño máximo: 5MB
- Formatos aceptados: JPG, PNG, WEBP
- Al eliminar un material, su imagen también se elimina del storage
