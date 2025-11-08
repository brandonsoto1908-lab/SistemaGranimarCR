// Configuración de límites de stock bajo
export const STOCK_LIMITS = {
  materiales: 2, // Menos de 2 láminas
  sobrantes: 5,  // Menos de 5 sobrantes
  discos: 5,     // Menos de 5 discos/herramientas
}

export interface StockAlert {
  tipo: 'material' | 'sobrante' | 'disco'
  id: string
  nombre: string
  cantidadActual: number
  limiteMinimo: number
  categoria?: string
  material?: string
}

// Email de notificación
export const ALERT_EMAIL = 'brandonsoto1908@gmail.com'

export function shouldAlert(cantidad: number, tipo: 'materiales' | 'sobrantes' | 'discos'): boolean {
  return cantidad < STOCK_LIMITS[tipo] && cantidad >= 0
}

export function formatStockAlert(alert: StockAlert): string {
  const tipoTexto = alert.tipo === 'material' ? 'Lámina' : 
                    alert.tipo === 'sobrante' ? 'Sobrante' : 
                    'Disco/Herramienta'
  
  return `⚠️ Stock Bajo: ${tipoTexto} "${alert.nombre}" - Cantidad: ${alert.cantidadActual} (Mínimo: ${alert.limiteMinimo})`
}
