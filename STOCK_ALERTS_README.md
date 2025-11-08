# 🚨 Sistema de Alertas de Stock Bajo - Granimar CR

## Funcionalidades Implementadas

### ✅ Detección Automática de Stock Bajo

El sistema verifica automáticamente el stock de:

- **Láminas/Materiales**: Menos de 2 unidades
- **Sobrantes**: Menos de 5 unidades  
- **Discos/Herramientas**: Menos de 5 unidades

### ✅ Banner de Alertas en Dashboard

- Muestra un banner amarillo con todas las alertas activas
- Agrupa por categoría (Láminas, Sobrantes, Discos)
- Botón para actualizar manualmente
- Botón para cerrar temporalmente
- Verifica automáticamente cada 30 minutos

### ✅ Notificaciones por Email

- Envía email automático a: **brandonsoto1908@gmail.com**
- Email con diseño profesional en HTML
- Lista todos los productos con stock bajo
- **Se envía máximo 1 email cada 24 horas** para evitar spam
- Incluye enlace directo al inventario

## 📦 Instalación

### 1. Instalar Resend (Servicio de Email)

```bash
npm install resend
```

### 2. Configurar API Key de Resend

1. Ve a [Resend.com](https://resend.com) y crea una cuenta gratuita
2. Obtén tu API key en la sección "API Keys"
3. Crea un archivo `.env.local` en la raíz del proyecto:

```env
RESEND_API_KEY=re_tu_api_key_aqui
```

### 3. Verificar Dominio (Opcional pero Recomendado)

Para producción, verifica tu dominio en Resend:
1. Ve a "Domains" en Resend
2. Agrega tu dominio
3. Configura los registros DNS
4. Actualiza el `from` en `/api/send-email/route.ts`:

```typescript
from: 'Granimar CR <alertas@tudominio.com>'
```

## 🔧 Configuración

### Ajustar Límites de Stock

Edita el archivo `src/lib/stockAlerts.ts`:

```typescript
export const STOCK_LIMITS = {
  materiales: 2,  // Cambiar según necesites
  sobrantes: 5,   // Cambiar según necesites
  discos: 5,      // Cambiar según necesites
}
```

### Cambiar Email de Destino

Edita el archivo `src/lib/stockAlerts.ts`:

```typescript
export const ALERT_EMAIL = 'tu-email@ejemplo.com'
```

### Ajustar Frecuencia de Verificación

Edita el archivo `src/lib/useStockAlerts.ts`:

```typescript
// Línea ~95
const interval = setInterval(() => {
  checkStockLevels()
}, 30 * 60 * 1000) // Cambiar 30 por los minutos que desees
```

### Ajustar Frecuencia de Emails

Edita el archivo `src/lib/useStockAlerts.ts`:

```typescript
// Línea ~89
const oneDay = 24 * 60 * 60 * 1000 // Cambiar 24 por las horas que desees
```

## 📊 Uso

### Ver Alertas en Dashboard

1. Accede al Dashboard: `http://localhost:3001`
2. Si hay stock bajo, verás un banner amarillo arriba
3. Click en "Ver Inventario" para ir al inventario completo

### Actualizar Manualmente

- Click en el botón de actualizar (⟳) en el banner
- El sistema volverá a verificar el stock inmediatamente

### Historial de Emails

- Los emails se guardan en LocalStorage para evitar duplicados
- Se resetea automáticamente cada 24 horas
- Para forzar un nuevo email, limpia LocalStorage:

```javascript
localStorage.removeItem('lastStockAlertEmail')
```

## 🧪 Pruebas

### Probar el Sistema de Alertas

1. Reduce el stock de un producto a menos del límite:
   - Materiales: < 2
   - Sobrantes: < 5
   - Discos: < 5

2. Recarga el Dashboard
3. Deberías ver el banner de alerta

### Probar Envío de Email

1. Asegúrate de tener configurada la API key de Resend
2. Reduce el stock de algún producto
3. Limpia el cache de emails: `localStorage.removeItem('lastStockAlertEmail')`
4. Recarga el Dashboard
5. Verifica tu email en brandonsoto1908@gmail.com

## 📁 Archivos Creados

```
src/
├── lib/
│   ├── stockAlerts.ts          # Configuración y límites
│   ├── emailService.ts         # Servicio de envío de emails
│   └── useStockAlerts.ts       # Hook para verificar stock
├── components/
│   └── StockAlertBanner.tsx    # Banner de alertas
└── app/
    └── api/
        └── send-email/
            └── route.ts        # API endpoint para emails
```

## 🎨 Personalización del Email

Edita `src/lib/emailService.ts` para cambiar el diseño del email.

El template incluye:
- Header con logo
- Lista de productos agrupados por categoría
- Badges de colores
- Botón para ver inventario
- Footer profesional

## ⚠️ Solución de Problemas

### Los emails no se envían

1. Verifica que `RESEND_API_KEY` esté en `.env.local`
2. Verifica que Resend esté instalado: `npm list resend`
3. Revisa la consola del navegador para errores
4. Verifica que no hayas enviado un email en las últimas 24h

### El banner no aparece

1. Verifica que haya productos con stock bajo
2. Abre la consola y busca errores
3. Verifica que el componente esté importado en `page.tsx`

### Cambiar límites no funciona

1. Reinicia el servidor de desarrollo
2. Limpia el cache del navegador
3. Verifica que los cambios estén en `stockAlerts.ts`

## 📧 Formato del Email

El email incluye:
- Asunto: "⚠️ Alerta: X producto(s) con stock bajo - Granimar CR"
- Destinatario: brandonsoto1908@gmail.com
- Contenido: Lista detallada de productos con:
  - Nombre del producto
  - Cantidad actual
  - Límite mínimo
  - Categoría/Material
  - Botón para acceder al sistema

## 🚀 Próximos Pasos (Opcional)

- [ ] Configurar dominio personalizado en Resend
- [ ] Agregar múltiples destinatarios
- [ ] Crear reporte semanal de stock
- [ ] Integrar con sistema de compras
- [ ] Agregar notificaciones push
- [ ] Historial de alertas en la base de datos

## 💡 Notas Importantes

- El sistema verifica el stock cada 30 minutos automáticamente
- Los emails se envían máximo 1 vez cada 24 horas
- El banner se puede cerrar pero reaparecerá en la próxima verificación
- Los límites de stock son configurables por tipo de producto
