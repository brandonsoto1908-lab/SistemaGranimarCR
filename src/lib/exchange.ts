// Exchange rate helper that prefers the Costa Rica Ministry of Finance API
// (https://api.hacienda.go.cr/indicadores/tc/dolar) and falls back to exchangerate.host.
// Caches the result in memory for 12 hours to avoid excessive requests.

type CacheEntry = {
  rate: number
  fetchedAt: number
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours
let cache: CacheEntry | null = null

const findFirstNumeric = (obj: any): number | null => {
  if (obj == null) return null
  if (typeof obj === 'number') return obj
  if (typeof obj === 'string') {
    const s = obj.trim()
    // avoid parsing date-like or mixed strings (e.g. '2024-01-25')
    if (!/^[0-9.,\s]+$/.test(s)) return null
    const parsed = parseFloat(s.replace(/\s+/g, '').replace(',', '.'))
    if (!isNaN(parsed)) return parsed
    return null
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const v = findFirstNumeric(item)
      if (v != null) return v
    }
  } else if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const v = findFirstNumeric(obj[k])
      if (v != null) return v
    }
  }
  return null
}

export const fetchUSDToCRC = async (date?: string): Promise<number> => {
  const now = Date.now()
  // If cached and fresh for latest rate, return
  if (!date && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rate
  }

  // Try Hacienda API first
  try {
    // Hacienda accepts optional fecha in YYYY-MM-DD as query param
    const haciendaUrl = date
      ? `https://api.hacienda.go.cr/indicadores/tc/dolar?fecha=${encodeURIComponent(date)}`
      : `https://api.hacienda.go.cr/indicadores/tc/dolar`

    const res = await fetch(haciendaUrl)
    if (res.ok) {
      const json = await res.json()
      // Try common property names
      // Hacienda common response shapes:
      // { serie: [ { fecha: 'YYYY-MM-DD', valor: '497.12' }, ... ] }
      // { valor: 497.12 }
      // Try serie[0].valor, then valor, then venta/compra fields, then fallback to robust search
      let rate: number | null = null
      try {
        if (json?.serie && Array.isArray(json.serie) && json.serie.length > 0) {
          const v = json.serie[0].valor ?? json.serie[0].Valor ?? json.serie[0].venta ?? json.serie[0].compra
          rate = findFirstNumeric(v)
        }
      } catch (e) {
        // ignore
      }

      if (rate == null) rate = findFirstNumeric(json?.valor ?? json?.Valor ?? json?.venta ?? json?.compra)
      if (rate == null) {
        // as last resort, search the whole object but prefer reasonable ranges
        const candidate = findFirstNumeric(json)
        if (candidate != null && candidate > 20 && candidate < 10000) rate = candidate
      }

      if (rate != null && !isNaN(rate) && rate > 0) {
        if (!date) cache = { rate, fetchedAt: now }
        return rate
      }
    }
  } catch (err) {
    // ignore and fallback
    console.warn('Hacienda API error, falling back:', err)
  }

  // Fallback to exchangerate.host
  try {
    const url = date
      ? `https://api.exchangerate.host/${encodeURIComponent(date)}?base=USD&symbols=CRC`
      : `https://api.exchangerate.host/latest?base=USD&symbols=CRC`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`exchangerate host error ${res.status}`)
    const json = await res.json()
    const rate = json && json.rates && json.rates.CRC ? Number(json.rates.CRC) : NaN
    if (!isNaN(rate) && rate > 0) {
      if (!date) cache = { rate, fetchedAt: now }
      return rate
    }
  } catch (err) {
    console.warn('Fallback exchangerate.host failed:', err)
  }

  // Final fallback: env var or default
  console.error('All exchange rate providers failed; using fallback rate')
  const env = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USD_TO_CRC
  const parsed = env ? parseFloat(String(env)) : NaN
  if (!isNaN(parsed) && parsed > 0) return parsed
  return 615.0
}
