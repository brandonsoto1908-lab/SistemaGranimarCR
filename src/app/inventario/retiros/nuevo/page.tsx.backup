// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_venta: number
}

export default function NuevoRetiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    material_id: '',
    cantidad: '',
    proyecto: '',
    motivo: '',
    usuario: '',
    fecha_retiro: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchMateriales()
  }, [])

  const fetchMateriales = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (error) throw error
      setMateriales(data || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
      toast.error('Error al cargar materiales')
    }
  }

  const handleMaterialChange = (materialId: string) => {
    const material = materiales.find(m => m.id === materialId)
    setSelectedMaterial(material || null)
    setFormData({ ...formData, material_id: materialId })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMaterial) {
      toast.error('Selecciona un material')
      return
    }

    const cantidad = parseFloat(formData.cantidad)
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (cantidad > selectedMaterial.cantidad_laminas) {
      toast.error(`No hay suficiente stock. Disponible: ${formatNumber(selectedMaterial.cantidad_laminas)} láminas`)
      return
    }

    try {
      setLoading(true)

      // Crear el retiro
      const { error: retiroError } = await supabase
        .from('retiros')
        .insert([{
          material_id: formData.material_id,
          cantidad: cantidad,
          proyecto: formData.proyecto || null,
          motivo: formData.motivo || null,
          usuario: formData.usuario || null,
          fecha_retiro: new Date(formData.fecha_retiro).toISOString(),
        }])

      if (retiroError) throw retiroError

      // Actualizar el stock del material
      const { error: updateError } = await supabase
        .from('materiales')
        .update({
          cantidad_laminas: selectedMaterial.cantidad_laminas - cantidad
        })
        .eq('id', formData.material_id)

      if (updateError) throw updateError

      toast.success('Retiro registrado exitosamente')
      router.push('/inventario/retiros')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario/retiros" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Registrar Retiro de Inventario</h1>
          <p className="page-subtitle">Registra la salida de material del inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Retiro */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Información del Retiro</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label label-required">Material</label>
                <select
                  value={formData.material_id}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Seleccionar material</option>
                  {materiales.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.nombre} ({formatNumber(material.cantidad_laminas)} disponibles)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label label-required">Cantidad de Láminas</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="input"
                  placeholder="0.00"
                  required
                />
                {selectedMaterial && (
                  <p className="text-sm text-gray-600 mt-1">
                    Disponible: {formatNumber(selectedMaterial.cantidad_laminas)} láminas
                  </p>
                )}
              </div>
            </div>

            {selectedMaterial && parseFloat(formData.cantidad) > selectedMaterial.cantidad_laminas && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <strong>Stock insuficiente:</strong> Solo hay {formatNumber(selectedMaterial.cantidad_laminas)} láminas disponibles.
                </div>
              </div>
            )}

            <div>
              <label className="label">Proyecto</label>
              <input
                type="text"
                value={formData.proyecto}
                onChange={(e) => setFormData({ ...formData, proyecto: e.target.value })}
                className="input"
                placeholder="Nombre del proyecto o cliente"
              />
            </div>

            <div>
              <label className="label">Motivo del Retiro</label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="textarea"
                rows={3}
                placeholder="Describe el motivo del retiro (opcional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha del Retiro</label>
                <input
                  type="date"
                  value={formData.fecha_retiro}
                  onChange={(e) => setFormData({ ...formData, fecha_retiro: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Usuario</label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="input"
                  placeholder="Nombre del usuario que retira"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {selectedMaterial && formData.cantidad && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Resumen del Retiro</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Material</p>
                  <p className="font-medium text-gray-900">{selectedMaterial.nombre}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cantidad a Retirar</p>
                  <p className="font-medium text-gray-900">{formatNumber(parseFloat(formData.cantidad))} láminas</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stock Restante</p>
                  <p className="font-medium text-gray-900">
                    {formatNumber(selectedMaterial.cantidad_laminas - parseFloat(formData.cantidad))} láminas
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <div className="card-footer">
            <div className="flex gap-4 justify-end">
              <Link href="/inventario/retiros" className="btn btn-ghost">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || (selectedMaterial && parseFloat(formData.cantidad) > selectedMaterial.cantidad_laminas)}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Registrar Retiro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
