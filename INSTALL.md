# 📋 Guía de Instalación y Configuración

## ⚡ Instalación Rápida

### 1. Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias:
- Next.js 14
- React 18
- TypeScript
- Supabase Client
- Tailwind CSS
- Lucide Icons
- React Hot Toast

### 2. Configurar Base de Datos en Supabase

#### a) Ejecutar Migraciones SQL

1. **Accede a Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/vavlehrkorioncfloedn
   - Ve a la sección **SQL Editor**

2. **Ejecutar Script Principal**
   - Abre `migrations/001_initial_setup.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor
   - Click en **Run**
   
   ✅ Esto creará:
   - Todas las tablas (materiales, discos, produccion, gastos, etc.)
   - Índices para optimización
   - Funciones RPC para cálculos
   - Triggers automáticos
   - Políticas RLS básicas

3. **Configurar Storage**
   - Abre `migrations/002_storage_setup.sql`
   - Copia y ejecuta en SQL Editor
   
   ✅ Esto creará:
   - Bucket `discos-images` para imágenes
   - Políticas de acceso público/privado

#### b) Verificar la Instalación

Ejecuta estas consultas para verificar:

```sql
-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Verificar bucket de storage
SELECT * FROM storage.buckets WHERE id = 'discos-images';
```

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🔍 Verificación Post-Instalación

### ✅ Checklist de Verificación

- [ ] Las dependencias se instalaron sin errores
- [ ] El servidor de desarrollo inicia correctamente
- [ ] Puedes ver el Dashboard en http://localhost:3000
- [ ] La navegación lateral funciona
- [ ] No hay errores en la consola del navegador
- [ ] Puedes acceder a /inventario, /produccion, /gastos

### 🧪 Pruebas Iniciales

#### 1. Probar Conexión con Supabase

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verifica que Supabase esté conectado
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

#### 2. Crear Primer Material

1. Ve a **Inventario** → **Nuevo Material**
2. Completa el formulario:
   - Nombre: "Granito Negro San Gabriel"
   - Categoría: "Piedra"
   - Cantidad Actual: 5
   - Precio Unitario: 150000
3. Click en **Guardar Material**
4. Deberías ver una notificación de éxito

#### 3. Verificar Dashboard

Regresa al Dashboard y verifica que muestre:
- Valor del inventario actualizado
- El nuevo material aparece si está bajo stock

## 🚨 Solución de Problemas Comunes

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules
npm install
```

### Error: "Supabase client returned an error"

**Causa**: Credenciales incorrectas o tablas no creadas

**Solución**:
1. Verifica que `.env.local` tenga las credenciales correctas
2. Ejecuta las migraciones SQL en Supabase
3. Reinicia el servidor de desarrollo

### Error: "Table 'materiales' does not exist"

**Causa**: Migraciones SQL no ejecutadas

**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta `migrations/001_initial_setup.sql` completo
3. Verifica con: `SELECT * FROM materiales LIMIT 1;`

### Error: "RLS policy violation"

**Causa**: Row Level Security bloqueando acceso

**Solución Temporal** (solo desarrollo):
```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE discos DISABLE ROW LEVEL SECURITY;
ALTER TABLE produccion DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
```

**Solución Permanente**: Implementar Supabase Auth (próxima versión)

### Imágenes no cargan en Discos/Herramientas

**Verificar**:
1. Bucket existe: `SELECT * FROM storage.buckets WHERE id = 'discos-images';`
2. Políticas configuradas: Ejecuta `migrations/002_storage_setup.sql`
3. URL pública correcta en `.env.local`

### Build Error en Producción

```bash
# Limpiar caché de Next.js
rm -rf .next
npm run build
```

## 📦 Datos de Prueba (Opcional)

Para poblar la base de datos con datos de ejemplo:

```sql
-- Insertar proveedores de prueba
INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
  ('Distribuidora Piedras CR', 'Juan Pérez', '2233-4455', 'ventas@piedrascr.com'),
  ('Herramientas Industriales SA', 'María González', '8877-6655', 'info@herramientas.co.cr'),
  ('Cuarzos Premium', 'Carlos Rodríguez', '2244-5566', 'info@cuarzospremium.com');

-- Insertar materiales de prueba
INSERT INTO materiales (nombre, categoria, unidad_medida, cantidad_actual, cantidad_minima, precio_unitario) VALUES
  ('Granito Negro San Gabriel', 'Piedra', 'lámina', 15, 5, 150000),
  ('Cuarzo Blanco Carrara', 'Cuarzo', 'lámina', 8, 3, 280000),
  ('Mármol Blanco Perla', 'Mármol', 'lámina', 4, 2, 320000),
  ('Porcelánico Calacatta', 'Porcelánico', 'lámina', 12, 5, 180000),
  ('Resina Epoxi Transparente', 'Consumible', 'litro', 25, 10, 15000);

-- Insertar discos de prueba
INSERT INTO discos (nombre, tipo, material_compatible, cantidad, marca, diametro) VALUES
  ('Disco Diamante Granito 115mm', 'cortar', 'granito', 10, 'Bosch', 115),
  ('Disco Pulir Cuarzo 100mm', 'pulir', 'cuarzo', 15, 'Makita', 100),
  ('Broca Diamante 8mm', 'broca', 'indiferente', 20, 'Dewalt', 8),
  ('Felpa de Pulir 125mm', 'felpa', 'indiferente', 8, 'Milwaukee', 125);

-- Insertar gastos de prueba
INSERT INTO gastos (concepto, categoria, monto, es_fijo, fecha, mes, anio) VALUES
  ('Electricidad Taller', 'servicios', 85000, true, '2025-01-15', 1, 2025),
  ('Agua Potable', 'servicios', 25000, true, '2025-01-15', 1, 2025),
  ('Mantenimiento Máquinas', 'mantenimiento', 120000, false, '2025-01-20', 1, 2025),
  ('Transporte Materiales', 'transporte', 45000, false, '2025-01-22', 1, 2025);

-- Insertar producción de prueba
INSERT INTO produccion (codigo_sobre, cliente, tipo_material, metros_lineales, fecha_produccion, mes, anio, costo_materiales, costo_mano_obra) VALUES
  ('PROD-2025-001', 'Casa Pérez', 'granito', 8.5, '2025-01-10', 1, 2025, 250000, 180000),
  ('PROD-2025-002', 'Apartamento Solís', 'cuarzo', 12.3, '2025-01-15', 1, 2025, 380000, 220000),
  ('PROD-2025-003', 'Oficina Central', 'porcelanico', 15.8, '2025-01-20', 1, 2025, 420000, 280000);
```

## 🎓 Próximos Pasos

1. **Explora el Sistema**
   - Navega por todos los módulos
   - Crea algunos registros de prueba
   - Familiarízate con la interfaz

2. **Personaliza el Sistema**
   - Modifica categorías en `src/app/inventario/nuevo/page.tsx`
   - Ajusta colores en `tailwind.config.js`
   - Agrega campos personalizados en las tablas

3. **Implementa Autenticación** (Opcional)
   - Configura Supabase Auth
   - Agrega login/registro
   - Habilita RLS con políticas por usuario

4. **Despliega a Producción**
   - Sigue la guía en README.md
   - Configura dominio personalizado
   - Habilita backups automáticos

## 📚 Recursos Adicionales

- [Documentación del Proyecto](./README.md)
- [Guía de SQL Migrations](./migrations/)
- [Ejemplos de Componentes](./src/components/)
- [API de Supabase](https://supabase.com/docs/reference/javascript)

---

¿Encontraste un problema? Abre un issue o contacta al equipo de desarrollo.
