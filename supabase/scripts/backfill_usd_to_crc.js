// Backfill script: fetch USD->CRC rate from Hacienda per invoice date and update facturacion.usd_to_crc_rate
// Usage:
//   SUPABASE_URL=https://<project>.supabase.co SUPABASE_KEY=<service_role_key> node supabase/scripts/backfill_usd_to_crc.js

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY (service role) environment variables')
  process.exit(1)
}

const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, opts)
  const text = await res.text()
  try { return JSON.parse(text) } catch (e) { return text }
}

const fetchInvoices = async () => {
  const url = `${SUPABASE_URL}/rest/v1/facturacion?select=id,fecha_factura&limit=10000`
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
  if (!res.ok) throw new Error(`Failed fetching invoices: ${res.status}`)
  return res.json()
}

const fetchHaciendaRate = async (date) => {
  const url = `https://api.hacienda.go.cr/indicadores/tc/dolar?fecha=${encodeURIComponent(date)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Hacienda API ${res.status}`)
  const json = await res.json()
  // Attempt to extract serie[0].valor or valor
  if (json?.serie && Array.isArray(json.serie) && json.serie.length > 0) {
    const v = json.serie[0].valor ?? json.serie[0].Valor ?? json.serie[0].venta ?? json.serie[0].compra
    const parsed = parseFloat(String(v).replace(',', '.'))
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  if (json?.valor) {
    const parsed = parseFloat(String(json.valor).replace(',', '.'))
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  throw new Error('Could not parse rate from Hacienda response')
}

const updateInvoiceRate = async (id, rate) => {
  const url = `${SUPABASE_URL}/rest/v1/facturacion?id=eq.${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ usd_to_crc_rate: rate })
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed updating ${id}: ${res.status} ${txt}`)
  }
  return true
}

;(async () => {
  try {
    console.log('Fetching invoices...')
    const invoices = await fetchInvoices()
    console.log(`Found ${invoices.length} invoices`)
    for (const inv of invoices) {
      const id = inv.id
      const date = inv.fecha_factura ? inv.fecha_factura.split('T')[0] : null
      if (!date) {
        console.warn(`Skipping ${id} - no date`)
        continue
      }
      try {
        const rate = await fetchHaciendaRate(date)
        await updateInvoiceRate(id, rate)
        console.log(`Updated ${id} -> ${rate}`)
      } catch (err) {
        console.error(`Error for ${id}:`, err.message || err)
      }
    }
    console.log('Done')
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
})()
