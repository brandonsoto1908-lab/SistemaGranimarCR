// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatNumber, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package } from 'lucide-react'
import Link from 'next/link'

const LAMINA_M2 = 5.12
const LAMINA_ML = 3.22

export default function EditRetiroPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(false)
  const [materiales, setMateriales] = useState<any[]>([])
  const [sobrantes, setSobrantes] = useState<any[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({
    material_id: '',
    tipo_retiro: 'laminas_completas',
    cantidad_laminas: 1,
    metros_lineales: 0,
    metros_cuadrados: 0,
    precio_cobrado_total: null,
    proyecto: '',
    cliente: '',
    usuario: '',
    descripcion: '',
    uso_sobrantes: false,
    fecha_retiro: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (!id) return
    fetchMateriales()
    fetchRetiro()
  }, [id])

  const fetchMateriales = async () => {
    const { data } = await supabase.from('materiales').select('id, nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro')
    setMateriales(data || [])
  }

  const fetchRetiro = async () => {
    try {
      const { data: retiro } = await supabase.from('retiros').select('*').eq('id', id).single()
      if (!retiro) {
        toast.error('Retiro no encontrado')
        router.push('/inventario/retiros')
        return
      }

      setFormData({
        material_id: retiro.material_id,
        tipo_retiro: retiro.tipo_retiro || 'laminas_completas',
        cantidad_laminas: retiro.cantidad_laminas || 0,
        metros_lineales: retiro.metros_lineales || 0,
        metros_cuadrados: retiro.metros_cuadrados ?? (retiro.tipo_retiro === 'metros_cuadrados' ? (retiro.metros_lineales || 0) : 0),
        precio_cobrado_total: retiro.precio_cobrado_total ?? retiro.precio_venta_total ?? null,
        proyecto: retiro.proyecto || '',
        cliente: retiro.cliente || '',
        usuario: retiro.usuario || '',
        descripcion: retiro.descripcion || '',
        uso_sobrantes: !!retiro.uso_sobrantes,
        fecha_retiro: retiro.fecha_retiro ? new Date(retiro.fecha_retiro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })

      if (retiro.material_id) {
        const material = materiales.find(m => m.id === retiro.material_id)
        setSelectedMaterial(material || null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error cargando retiro')
    }
  }

  useEffect(() => {
    if (formData.material_id && materiales.length > 0) {
      const material = materiales.find(m => m.id === formData.material_id)
      setSelectedMaterial(material || null)
    }
  }, [formData.material_id, materiales])

  const calcularTotales = () => {
    if (!selectedMaterial) return { costo: 0, venta: 0, ganancia: 0 }

    let costo = 0
    let venta = 0

    if (formData.tipo_retiro === 'laminas_completas') {
      costo = formData.cantidad_laminas * selectedMaterial.precio_costo
      venta = formData.cantidad_laminas * selectedMaterial.precio_venta
    } else if (formData.tipo_retiro === 'metros_cuadrados') {
      const m2 = formData.metros_cuadrados || 0
      costo = Math.ceil(m2 / LAMINA_M2) * selectedMaterial.precio_costo
      venta = m2 * (selectedMaterial.precio_por_metro || selectedMaterial.precio_venta / LAMINA_M2)
    } else {
      const ml = formData.metros_lineales || 0
      const metrosLinealesVenta = (formData.largo_metros || 0) + (formData.ancho_metros || 0)
      costo = Math.ceil(ml / LAMINA_M2) * selectedMaterial.precio_costo
      venta = metrosLinealesVenta * selectedMaterial.precio_lineal || ml * (selectedMaterial.precio_por_metro || selectedMaterial.precio_venta / LAMINA_M2)
    }

    // Allow overriding the calculated sale price with a manual "precio_cobrado_total"
    const precioCobrado = formData.precio_cobrado_total != null ? Number(formData.precio_cobrado_total) : venta
    const ganancia = precioCobrado - costo
    return { costo, venta, ganancia, precioCobrado }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    try {
      const totals = calcularTotales()

      const updates: any = {
        material_id: formData.material_id,
        tipo_retiro: formData.tipo_retiro,
        cantidad_laminas: formData.tipo_retiro === 'laminas_completas' ? formData.cantidad_laminas : 0,
        metros_lineales: formData.metros_lineales,
        metros_cuadrados: formData.metros_cuadrados,
        proyecto: formData.proyecto,
        cliente: formData.cliente || null,
        usuario: formData.usuario,
        descripcion: formData.descripcion || null,
        costo_total: totals.costo,
        precio_venta_total: totals.precioCobrado ?? totals.venta,
        precio_cobrado_total: totals.precioCobrado ?? null,
        ganancia: totals.ganancia,
        uso_sobrantes: !!formData.uso_sobrantes,
        fecha_retiro: new Date(formData.fecha_retiro).toISOString(),
      }

      let res
      try {
        res = await supabase.from('retiros').update(updates).eq('id', id).select().single()
      } catch (err) {
        // Supabase client may throw; normalize
        res = err
      }

      // If update returned an error about metros_cuadrados being not updatable, retry without that field
      if (res?.error && /metros_cuadrados/i.test(String(res.error.message || res.error))) {
        console.warn('Update failed due to metros_cuadrados, retrying without that field')
        delete updates.metros_cuadrados
        const { data: data2, error: error2 } = await supabase.from('retiros').update(updates).eq('id', id).select().single()
        if (error2) {
          console.error('Retry without metros_cuadrados failed:', error2)
          toast.error('Error actualizando retiro: ' + (error2.message || JSON.stringify(error2)))
          return
        }
      } else if (res?.error) {
        console.error('Error updating retiro:', res.error)
        toast.error('Error actualizando retiro: ' + (res.error.message || JSON.stringify(res.error)))
        return
      }
      // Confirm update worked
      toast.success('Retiro actualizado')
      router.push('/inventario/retiros')
    } catch (error) {
      console.error(error)
      toast.error('Error actualizando retiro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventario/retiros" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Editar Retiro</h1>
          <p className="page-subtitle">Modificar datos del retiro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-body space-y-4">
            <div>
              <label className="label">Material *</label>
              <select
                value={formData.material_id}
                onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Seleccionar material...</option>
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select value={formData.tipo_retiro} onChange={(e) => setFormData({ ...formData, tipo_retiro: e.target.value })} className="input">
                  <option value="laminas_completas">Láminas</option>
                  <option value="metros_lineales">Metros lineales</option>
                  <option value="metros_cuadrados">Metros cuadrados (m²)</option>
                </select>
              </div>

              <div>
                <label className="label">Uso sobrantes</label>
                <select value={formData.uso_sobrantes ? '1' : '0'} onChange={(e) => setFormData({ ...formData, uso_sobrantes: e.target.value === '1' })} className="input">
                  <option value="0">No</option>
                  <option value="1">Sí</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Cantidad / Metros</label>
              {formData.tipo_retiro === 'laminas_completas' ? (
                <input type="number" className="input" value={formData.cantidad_laminas} onChange={(e) => setFormData({ ...formData, cantidad_laminas: Number(e.target.value) })} />
              ) : formData.tipo_retiro === 'metros_cuadrados' ? (
                <input type="number" step="0.01" className="input" value={formData.metros_cuadrados} onChange={(e) => setFormData({ ...formData, metros_cuadrados: parseFloat(e.target.value) || 0 })} />
              ) : (
                <input type="number" step="0.01" className="input" value={formData.metros_lineales} onChange={(e) => setFormData({ ...formData, metros_lineales: Number(e.target.value) })} />
              )}
            </div>

            <div>
              <label className="label">Precio cobrado (opcional)</label>
              <input type="number" step="0.01" className="input" value={formData.precio_cobrado_total ?? ''} onChange={(e) => setFormData({ ...formData, precio_cobrado_total: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              <div className="text-xs text-gray-500 mt-1">Si se deja vacío se usará el precio calculado automáticamente.</div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" /> Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
