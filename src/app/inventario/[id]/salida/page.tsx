'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Minus } from 'lucide-react'
import Link from 'next/link'

interface Material {
  id: string
  nombre: string
  unidad_medida: string | null
  cantidad_actual: number
}

export default function SalidaMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [material, setMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    cantidad: 0,
    motivo: '',
    referencia: '',
    usuario: '',
  })

  useEffect(() => {
    if (materialId) {
      fetchMaterial()
    }
  }, [materialId])

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('id, nombre, unidad_medida, cantidad_actual')
        .eq('id', materialId)
        .single()

      if (error) throw error
      setMaterial(data)
    } catch (error) {
      console.error('Error fetching material:', error)
      toast.error('Error al cargar material')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (formData.cantidad > (material?.cantidad_actual || 0)) {
      toast.error('La cantidad no puede ser mayor al stock disponible')
      return
    }

    setLoading(true)
    try {
      // Crear movimiento
      const { error: movimientoError } = await supabase
        .from('materiales_movimientos')
        .insert([{
          material_id: materialId,
          tipo_movimiento: 'salida',
          cantidad: formData.cantidad,
          motivo: formData.motivo || null,
          referencia: formData.referencia || null,
          usuario: formData.usuario || null,
        }])

      if (movimientoError) throw movimientoError

      // Actualizar cantidad del material
      const nuevaCantidad = (material?.cantidad_actual || 0) - formData.cantidad
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ 
          cantidad_actual: nuevaCantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId)

      if (updateError) throw updateError

      toast.success('Salida registrada exitosamente')
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error creating salida:', error)
      toast.error('Error al registrar salida: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  const stockRestante = material.cantidad_actual - formData.cantidad

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Salida de Material</h1>
          <p className="page-subtitle">{material.nombre}</p>
        </div>
      </div>

      {/* Current Stock */}
      <div className="alert alert-warning">
        <div>
          <strong>Stock Disponible:</strong> {material.cantidad_actual} {material.unidad_medida || 'unidades'}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-4">
          <div>
            <label className="label label-required">Cantidad a Retirar</label>
            <input
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
              className="input"
              step="0.01"
              min="0"
              max={material.cantidad_actual}
              required
            />
            <p className={`text-sm mt-1 ${stockRestante < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              Stock restante: {stockRestante.toFixed(2)} {material.unidad_medida}
              {stockRestante < 0 && ' ⚠️ Stock insuficiente'}
            </p>
          </div>

          <div>
            <label className="label label-required">Motivo</label>
            <input
              type="text"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="input"
              placeholder="Ej: Producción, Venta, Ajuste"
              required
            />
          </div>

          <div>
            <label className="label">Referencia (Orden/Proyecto)</label>
            <input
              type="text"
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              className="input"
              placeholder="Código de orden o proyecto"
            />
          </div>

          <div>
            <label className="label">Usuario</label>
            <input
              type="text"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              className="input"
              placeholder="Nombre de quien registra"
            />
          </div>
        </div>

        <div className="card-footer flex justify-end gap-3">
          <Link href="/inventario" className="btn btn-ghost">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading || stockRestante < 0} 
            className="btn btn-warning"
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Guardando...
              </>
            ) : (
              <>
                <Minus className="w-5 h-5" />
                Registrar Salida
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
