# 🏗️ Sistema de Gestión Granimar CR

Sistema completo de gestión empresarial para fabricación y corte de piedras (granito, cuarzo, mármol, porcelánico). Maneja inventarios, producción, gastos, reportes y herramientas especializadas.

## 🎯 Tecnologías

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, Headless UI, Lucide Icons
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Despliegue**: Vercel

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env.local` ya está configurado con las credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vavlehrkorioncfloedn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://vavlehrkorioncfloedn.supabase.co/storage/v1/object/public
```

### 3. Ejecutar Migraciones SQL

1. Accede a tu proyecto en [Supabase](https://supabase.com/dashboard/project/vavlehrkorioncfloedn)
2. Ve a **SQL Editor**
3. Ejecuta los scripts en orden:
   - `migrations/001_initial_setup.sql` - Crea todas las tablas, índices y funciones
   - `migrations/002_storage_setup.sql` - Configura el storage para imágenes

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
SistemaGranimarCR/
├── src/
│   ├── app/                    # Páginas Next.js (App Router)
│   │   ├── layout.tsx          # Layout principal con navegación
│   │   ├── page.tsx            # Dashboard
│   │   ├── globals.css         # Estilos globales y sistema de diseño
│   │   ├── inventario/         # Módulo de inventario de materiales
│   │   ├── produccion/         # Módulo de producción
│   │   ├── gastos/             # Módulo de gastos
│   │   ├── proveedores/        # Módulo de proveedores
│   │   └── reportes/           # Módulo de reportes
│   ├── components/             # Componentes React reutilizables
│   │   ├── Navigation.tsx      # Menú lateral de navegación
│   │   └── ...
│   ├── lib/                    # Utilidades y configuración
│   │   ├── supabase.ts         # Cliente de Supabase
│   │   └── utils.ts            # Funciones de utilidad
│   └── types/                  # Definiciones de TypeScript
│       └── database.types.ts   # Tipos generados de Supabase
├── migrations/                 # Scripts SQL para Supabase
│   ├── 001_initial_setup.sql   # Tablas, índices, funciones RPC
│   └── 002_storage_setup.sql   # Configuración de Storage
├── public/                     # Archivos estáticos
├── .env.local                  # Variables de entorno (NO subir a git)
├── next.config.js              # Configuración de Next.js
├── tailwind.config.js          # Configuración de Tailwind CSS
├── tsconfig.json               # Configuración de TypeScript
└── package.json                # Dependencias del proyecto
```

## 📦 Módulos del Sistema

### 1. **Dashboard**
- Resumen de inventario, gastos y producción
- Alertas de stock bajo
- Accesos rápidos a funciones principales

### 2. **Inventario de Materiales**
- CRUD completo de materiales
- Movimientos de entrada/salida
- Alertas de stock mínimo
- Historial de movimientos
- Búsqueda y filtros avanzados

### 3. **Inventario de Discos/Herramientas**
- Gestión de herramientas y consumibles
- Galería de imágenes (hasta 5 por producto)
- Especificaciones técnicas (marca, diámetro, espesor)
- Filtros por tipo y material compatible
- Vista de grid y lista

### 4. **Producción**
- Registro de órdenes por "sobre"
- Cálculo automático de costos fijos distribuidos
- Toggle para incluir/excluir gastos fijos
- Estados: en proceso, completado, entregado
- Asociación de materiales usados

### 5. **Gastos**
- Registro de gastos operativos
- Clasificación: fijos vs variables
- Categorías personalizables
- Asociación con proveedores
- Reportes por período

### 6. **Proveedores**
- CRUD de proveedores
- Información de contacto completa
- Historial de compras

### 7. **Reportes**
- Costos de producción por sobre
- Retiros de inventario
- Valorización de stock
- Tendencias y comparativas

## 🗄️ Base de Datos

### Tablas Principales

- **materiales**: Inventario de materiales de producción
- **materiales_movimientos**: Historial de entradas/salidas
- **discos**: Herramientas y consumibles con imágenes
- **discos_movimientos**: Uso de herramientas
- **produccion**: Órdenes de producción con costos
- **gastos**: Gastos operativos (fijos y variables)
- **proveedores**: Información de proveedores
- **retiros**: Retiros de material para proyectos

### Funciones RPC

#### `calcular_costo_fijo_por_metro(p_year, p_month, p_metros_lineales)`
Calcula el costo fijo asignado según los metros lineales producidos en un mes.

```sql
SELECT calcular_costo_fijo_por_metro(2025, 1, 10.5);
-- Retorna el costo fijo proporcional para 10.5 metros en enero 2025
```

#### `totales_fijos_produccion(p_year, p_month)`
Obtiene totales de gastos fijos y metros producidos en un período.

```sql
SELECT * FROM totales_fijos_produccion(2025, 1);
-- Retorna: total_gastos_fijos, total_metros_producidos, costo_por_metro
```

## 🎨 Sistema de Diseño

El proyecto incluye un sistema de diseño completo en `globals.css`:

### Componentes CSS

```html
<!-- Botones -->
<button class="btn btn-primary">Primario</button>
<button class="btn btn-success">Éxito</button>
<button class="btn btn-danger">Peligro</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Cards -->
<div class="card">
  <div class="card-header">Título</div>
  <div class="card-body">Contenido</div>
  <div class="card-footer">Acciones</div>
</div>

<!-- Badges -->
<span class="badge badge-success">Activo</span>
<span class="badge badge-warning">Pendiente</span>

<!-- Inputs -->
<input type="text" class="input" placeholder="Escribe aquí..." />
<select class="input"><option>Opción 1</option></select>
<textarea class="textarea"></textarea>

<!-- Tablas -->
<div class="table-container">
  <table class="table">...</table>
</div>
```

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas tienen RLS habilitado. Las políticas actuales permiten:
- **Usuarios autenticados**: Todas las operaciones
- **Usuarios anónimos**: Solo lectura en materiales y discos

### Storage
- Bucket `discos-images` configurado como público para lectura
- Solo usuarios autenticados pueden subir/modificar/eliminar

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye la aplicación
npm start            # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta ESLint

# Type Checking
npm run type-check   # Verifica tipos TypeScript
```

## 🚀 Despliegue en Vercel

### Despliegue Automático

1. **Conecta el repositorio a Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configura las variables de entorno en Vercel**
   - Ve a Project Settings > Environment Variables
   - Agrega las mismas variables del `.env.local`

3. **Push a GitHub**
   ```bash
   git push origin main
   ```
   
   Vercel desplegará automáticamente en cada push.

### Despliegue Manual

```bash
vercel --prod
```

## 🔧 Configuración Avanzada

### Optimización de Imágenes

Next.js optimiza automáticamente las imágenes de Supabase Storage:

```tsx
import Image from 'next/image'

<Image
  src="https://vavlehrkorioncfloedn.supabase.co/storage/v1/object/public/discos-images/disco1.jpg"
  width={400}
  height={300}
  alt="Disco de corte"
/>
```

### ISR (Incremental Static Regeneration)

Para páginas con datos que cambian ocasionalmente:

```tsx
// En cualquier página
export const revalidate = 60 // Revalidar cada 60 segundos
```

## 🐛 Troubleshooting

### Error: "Cannot connect to Supabase"
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "Table does not exist"
- Ejecuta las migraciones SQL en Supabase SQL Editor
- Verifica que las tablas se crearon correctamente

### Error de CORS en Storage
- Verifica que el bucket `discos-images` exista
- Ejecuta el script `002_storage_setup.sql`

### Imágenes no cargan
- Verifica la configuración de `next.config.js`
- Asegúrate de que las URLs sean públicas

## 📚 Recursos

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contribución

Este es un proyecto privado para Granimar CR. Para contribuir:

1. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Agrega nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

Propietario: Granimar CR © 2025. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@granimarcr.com
- Teléfono: +506 XXXX-XXXX

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024
