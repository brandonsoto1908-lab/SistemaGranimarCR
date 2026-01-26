// Formatear números a moneda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formatea en CRC usando la tasa USD->CRC
export const formatCRC = (value: number, rate?: number): string => {
  const r = rate && rate > 0 ? rate : getUSDToCRC()
  const crcValue = value * r
  // Evitar el símbolo '₡' que puede no renderizar correctamente en jsPDF.
  // Devolver prefijo 'CRC' seguido del número formateado en locale es-CR.
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(crcValue)
  // Usar el símbolo de colón '₡' y añadir '(CRC)' como fallback legible
  return `₡ ${formatted} (CRC)`
}

// Obtener tasa USD -> CRC desde variable de entorno `NEXT_PUBLIC_USD_TO_CRC`.
// Si no está definida, usar un valor razonable por defecto.
export const getUSDToCRC = (): number => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USD_TO_CRC) {
      const parsed = parseFloat(String(process.env.NEXT_PUBLIC_USD_TO_CRC))
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  } catch (e) {
    // ignore
  }
  return 615.0 // fallback rate (puede ajustarse en entorno)
}

// Asynchronous getter that fetches a fresh USD->CRC rate (uses exchangerate.host)
export const getUSDToCRCAsync = async (date?: string): Promise<number> => {
  try {
    // dynamic import to avoid circular deps in some environments
    const mod = await import('./exchange')
    return await mod.fetchUSDToCRC(date)
  } catch (e) {
    return getUSDToCRC()
  }
}

// Formatea un monto en USD y añade entre paréntesis el equivalente en colones (CRC).
export const formatCurrencyWithCRC = (value: number, rate?: number): string => {
  const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  const r = rate && rate > 0 ? rate : getUSDToCRC()
  const crcValue = value * r
  const crc = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(crcValue)

  return `${usd} (${crc})`
}

// Formatear números con decimales
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Formatear fechas
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// Formatear fecha corta
export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

// Obtener fecha en formato YYYY-MM-DD para inputs
export const getDateInputValue = (date?: Date): string => {
  const d = date || new Date()
  return d.toISOString().split('T')[0]
}

// Extraer mes y año de una fecha
export const getMonthYear = (date: string | Date): { mes: number; anio: number } => {
  const d = typeof date === 'string' ? new Date(date) : date
  return {
    mes: d.getMonth() + 1, // 1-12
    anio: d.getFullYear(),
  }
}

// Validar si es un número válido
export const isValidNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

// Parsear número decimal
export const parseDecimal = (value: string | number): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(',', '.'))
  return isNaN(parsed) ? 0 : parsed
}

// Generar código único
export const generateCode = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `${prefix}${timestamp}-${random}`.toUpperCase()
}

// Capitalizar primera letra
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Debounce function para búsquedas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Clasificar nivel de stock
export const getStockLevel = (
  currentStock: number,
  minStock: number | null
): 'high' | 'medium' | 'low' | 'critical' => {
  if (!minStock) return 'high'
  const ratio = currentStock / minStock
  if (ratio >= 2) return 'high'
  if (ratio >= 1) return 'medium'
  if (ratio >= 0.5) return 'low'
  return 'critical'
}

// Obtener badge de estado
export const getStatusBadge = (
  status: string
): { label: string; className: string } => {
  const statusMap: Record<string, { label: string; className: string }> = {
    en_proceso: { label: 'En Proceso', className: 'badge-warning' },
    completado: { label: 'Completado', className: 'badge-success' },
    entregado: { label: 'Entregado', className: 'badge-info' },
    cancelado: { label: 'Cancelado', className: 'badge-danger' },
  }
  return statusMap[status] || { label: status, className: 'badge-gray' }
}

// Calcular porcentaje de cambio
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Agrupar array por propiedad
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

// Ordenar array por múltiples criterios
export const sortBy = <T>(
  array: T[],
  ...keys: ((item: T) => any)[]
): T[] => {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = key(a)
      const bVal = key(b)
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
    }
    return 0
  })
}

// Validar email
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validar teléfono (formato CR)
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 8 && /^[2-8]/.test(cleaned)
}

// Formatear teléfono
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 8) return phone
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
}
