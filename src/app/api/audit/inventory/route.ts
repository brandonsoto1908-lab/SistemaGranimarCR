import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const LAMINA_M2 = 3.22 * 1.59 // ≈5.12 m²

export async function GET() {
  try {
    const { data: materiales, error: matErr } = await supabase
      .from('materiales')
      .select('id, nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro')
      .order('nombre')

    if (matErr) throw matErr

    const { data: sobros, error: sobrErr } = await supabase
      .from('sobros')
      .select('id, material_id, metros_lineales, usado, aprovechable')
      .eq('usado', false)
      .eq('aprovechable', true)

    if (sobrErr) throw sobrErr

    const perMaterial = (materiales || []).map((m: any) => {
      const sobrantes = (sobros || []).filter((s: any) => s.material_id === m.id)
      const sobrantes_m2 = sobrantes.reduce((sum: number, s: any) => sum + (parseFloat(s.metros_lineales) || 0), 0)

      const computed = {
        id: m.id,
        nombre: m.nombre,
        cantidad_laminas: m.cantidad_laminas,
        metros_totales_m2: (m.cantidad_laminas || 0) * LAMINA_M2,
        valor_costo: (m.cantidad_laminas || 0) * (m.precio_costo || 0),
        valor_venta: (m.cantidad_laminas || 0) * (m.precio_venta || 0),
        sobrantes_m2,
        sobrantes_valor: sobrantes_m2 * (m.precio_por_metro || 0),
      }

      return computed
    })

    const totals = perMaterial.reduce(
      (acc: any, row: any) => {
        acc.total_costo += row.valor_costo || 0
        acc.total_venta += row.valor_venta || 0
        acc.total_sobrantes += row.sobrantes_valor || 0
        acc.total_m2 += row.metros_totales_m2 || 0
        return acc
      },
      { total_costo: 0, total_venta: 0, total_sobrantes: 0, total_m2: 0 }
    )

    return NextResponse.json({ ok: true, totals, perMaterial })
  } catch (err: any) {
    console.error('Audit error:', err)
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
