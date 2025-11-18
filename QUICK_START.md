# 🚀 GUÍA RÁPIDA DE DEPLOYMENT

## ✅ Estado del Proyecto

Tu proyecto está **100% listo** para desplegar en Vercel. Todos los archivos de configuración, documentación y scripts de verificación están en su lugar.

---

## 📋 PASOS PARA DESPLEGAR (10 minutos)

### 1️⃣ Verificar Localmente (2 min)

Ejecuta el script de verificación:

```powershell
.\scripts\pre-deploy.ps1
```

O ejecuta manualmente:

```bash
npm run pre-deploy
```

Si hay errores, corrígelos antes de continuar.

### 2️⃣ Subir a GitHub (1 min)

```bash
git add .
git commit -m "🚀 Preparar para deploy en Vercel"
git push origin main
```

### 3️⃣ Importar en Vercel (2 min)

1. Ve a https://vercel.com/new
2. Selecciona tu repositorio de GitHub: `SistemaGranimarCR`
3. Click en **Import**

### 4️⃣ Configurar Variables de Entorno (3 min)

En la página de configuración de Vercel, agrega estas 4 variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vavlehrkorioncfloedn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc[...tu key completa...]
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://vavlehrkorioncfloedn.supabase.co/storage/v1/object/public
RESEND_API_KEY=re_AQACuL14_4nZfDqoZGQfzvRQjMJAQziDE
```

> 💡 **Tip**: Copia los valores desde tu archivo `.env.local`

### 5️⃣ Deploy (2 min)

1. Click en **Deploy**
2. Espera a que termine el build (~2 minutos)
3. ¡Listo! 🎉

---

## 🗄️ CONFIGURAR BASE DE DATOS EN PRODUCCIÓN

### Paso 1: Ejecutar Migraciones

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/vavlehrkorioncfloedn
2. Click en **SQL Editor**
3. Ejecuta estas migraciones en orden:

```sql
-- 1. Actualizar sistema de retiros
migrations/009_update_retiros_sobros.sql

-- 2. Agregar soporte de imágenes
migrations/010_add_imagen_to_materiales.sql

-- 3. (Opcional) Insertar materiales iniciales
migrations/011_insert_initial_materials.sql
```

### Paso 2: Configurar Storage

1. Ve a **Storage** en Supabase
2. Verifica que exista el bucket `materiales`
3. Si no existe:
   - Click en **New bucket**
   - Nombre: `materiales`
   - Marca como **Public**
   - Click en **Create**

---

## ✅ VERIFICAR DEPLOYMENT

Después del deploy, prueba estos puntos:

1. **Dashboard**: ¿Se muestran los datos correctamente?
2. **Inventario**: ¿Puedes crear, editar y eliminar materiales?
3. **Imágenes**: ¿Puedes subir y ver imágenes?
4. **Entrada/Salida**: ¿Funcionan los movimientos?
5. **Retiros**: ¿Puedes crear retiros y se generan sobrantes?

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, consulta:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía completa paso a paso (400+ líneas)
- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist detallado
- **[README.md](./README.md)** - Documentación del proyecto

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Build falla en Vercel
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Vercel Dashboard
- Ejecuta `npm run build` localmente para reproducir el error

### Imágenes no cargan
- Verifica que el bucket `materiales` sea público
- Verifica la URL en `NEXT_PUBLIC_SUPABASE_STORAGE_URL`

### No se muestran datos
- Verifica que las migraciones se ejecutaron correctamente
- Verifica las credenciales de Supabase

### Emails no se envían
- Verifica que `RESEND_API_KEY` sea correcta
- Verifica la configuración en https://resend.com/dashboard

---

## 📞 CONTACTO

Si necesitas ayuda:
- Email: granimarcr@gmail.com
- Revisa los logs en Vercel Dashboard

---

**¡Éxito con tu deployment! 🚀**
