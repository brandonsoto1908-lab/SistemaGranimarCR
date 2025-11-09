// Configuración - Alertar solo cuando hay 0 en stock
export const STOCK_LIMITS = {
  materiales: 0, // Sin stock
  sobrantes: 0,  // Sin stock
  discos: 0,     // Sin stock
}

export interface StockAlert {
  tipo: 'material' | 'sobrante' | 'disco'
  id: string
  nombre: string
  cantidadActual: number
  categoria?: string
  material?: string
}

// Email de notificación
export const ALERT_EMAIL = 'granimarcr@gmail.com'

export function shouldAlert(cantidad: number): boolean {
  return cantidad === 0
}

export function formatStockAlert(alert: StockAlert): string {
  const tipoTexto = alert.tipo === 'material' ? 'Lámina' : 
                    alert.tipo === 'sobrante' ? 'Sobrante' : 
                    'Disco/Herramienta'
  
  return `🚫 Sin Stock: ${tipoTexto} "${alert.nombre}" - Cantidad: ${alert.cantidadActual}`
}
