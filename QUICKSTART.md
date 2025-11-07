# 🚀 Inicio Rápido - Sistema Granimar CR

## ⚡ 3 Pasos para Empezar

### Paso 1: Instalar Dependencias (2 minutos)
```bash
npm install
```

### Paso 2: Configurar Base de Datos (5 minutos)

1. **Ir a Supabase SQL Editor**: https://supabase.com/dashboard/project/vavlehrkorioncfloedn/editor
2. **Copiar y ejecutar** `migrations/001_initial_setup.sql`
3. **Copiar y ejecutar** `migrations/002_storage_setup.sql`

### Paso 3: Iniciar Aplicación (1 minuto)
```bash
npm run dev
```

**✅ Listo!** Abre http://localhost:3000

---

## 📱 Primeros Pasos en la Aplicación

### 1. Explorar Dashboard
- Ve a http://localhost:3000
- Observa el resumen general del sistema

### 2. Agregar Primer Material
1. **Inventario** → **Nuevo Material**
2. Completa:
   - Nombre: "Granito Negro Galaxy"
   - Categoría: "Piedra"
   - Cantidad: 10
   - Precio: 150000
3. **Guardar**

### 3. Crear Orden de Producción
1. **Producción** → **Nueva Orden**
2. Completa:
   - Código: Se genera automáticamente
   - Cliente: "Casa Ejemplo"
   - Metros: 8.5
   - Material: Granito
3. **Guardar**

### 4. Registrar Gasto
1. **Gastos** → **Nuevo Gasto**
2. Completa:
   - Concepto: "Electricidad"
   - Monto: 85000
   - Tipo: Fijo ✅
3. **Guardar**

---

## 🎯 Módulos Principales

| Módulo | URL | Descripción |
|--------|-----|-------------|
| 📊 Dashboard | `/` | Vista general y alertas |
| 📦 Inventario | `/inventario` | Gestión de materiales |
| 🔧 Herramientas | `/inventario/herramientas/discos` | Discos y herramientas |
| 🏭 Producción | `/produccion` | Órdenes de producción |
| 💰 Gastos | `/gastos` | Gastos operativos |
| 👥 Proveedores | `/proveedores` | Gestión de proveedores |
| 📈 Reportes | `/reportes` | Análisis y reportes |

---

## 🔥 Atajos de Teclado (Próximamente)

- `Ctrl + K` → Búsqueda global
- `Ctrl + N` → Nuevo material
- `Ctrl + P` → Nueva producción
- `Esc` → Cerrar modal

---

## 💡 Tips Útiles

### ⚡ Cálculo Automático de Costos Fijos
Los gastos marcados como "Fijos" se distribuyen automáticamente en las órdenes de producción según los metros lineales.

### 📸 Galería de Imágenes
Cada herramienta puede tener hasta 5 imágenes para fácil identificación visual.

### 🔔 Alertas de Stock
El sistema alertará automáticamente cuando un material esté bajo el stock mínimo.

### 🎨 Categorías Personalizables
Puedes agregar tus propias categorías editando los archivos de formulario.

---

## 🆘 Ayuda Rápida

### No puedo conectar con Supabase
```bash
# Verifica las variables de entorno
cat .env.local

# Debe mostrar:
# NEXT_PUBLIC_SUPABASE_URL=https://vavlehrkorioncfloedn.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Error "Table does not exist"
Ejecuta las migraciones SQL en Supabase SQL Editor

### El servidor no inicia
```bash
# Limpia y reinstala
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📚 Documentación Completa

- 📖 [README Completo](./README.md)
- 🔧 [Guía de Instalación Detallada](./INSTALL.md)
- 🗄️ [Scripts SQL](./migrations/)

---

## 🎓 Video Tutoriales (Próximamente)

- [ ] Configuración inicial
- [ ] Gestión de inventario
- [ ] Cálculo de costos de producción
- [ ] Generación de reportes

---

## 📞 Soporte

**¿Necesitas ayuda?**
- 📧 Email: soporte@granimarcr.com
- 📱 WhatsApp: +506 XXXX-XXXX
- 💬 Chat en vivo (horario: 8am-5pm)

---

**¡Comienza ahora!** 🚀

```bash
npm install && npm run dev
```
