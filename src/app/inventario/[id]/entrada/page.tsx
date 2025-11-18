// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_costo: number
  imagen_url: string | null
}

export default function EntradaMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [material, setMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    cantidad_laminas: 0,
    precio_costo: 0,
    motivo: '',
    proveedor: '',
    factura: '',
  })

  // Una lámina de 3.22m × 1.59m puede generar mínimo 2 cortes de 60cm de ancho (aproximado)
  const LAMINA_ML = 6.44 // metros lineales por lámina (mínimo 2 cortes)
  const LAMINA_M2 = 5.12 // metros cuadrados por lámina (3.22m × 1.59m)

  useEffect(() => {
    if (materialId) {
      fetchMaterial()
    }
  }, [materialId])

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('id, nombre, cantidad_laminas, precio_costo, imagen_url')
        .eq('id', materialId)
        .single()

      if (error) throw error
      setMaterial(data)
      // Pre-cargar el precio de costo actual
      setFormData(prev => ({ ...prev, precio_costo: data.precio_costo || 0 }))
    } catch (error) {
      console.error('Error fetching material:', error)
      toast.error('Error al cargar material')
      router.push('/inventario')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.cantidad_laminas <= 0) {
      toast.error('La cantidad de láminas debe ser mayor a 0')
      return
    }

    if (!formData.motivo.trim()) {
      toast.error('El motivo es requerido')
      return
    }

    setLoading(true)
    try {
      // Actualizar stock y precio del material
      const nuevaCantidad = (material?.cantidad_laminas || 0) + formData.cantidad_laminas
      
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ 
          cantidad_laminas: nuevaCantidad,
          precio_costo: formData.precio_costo || material?.precio_costo || 0,
        })
        .eq('id', materialId)

      if (updateError) throw updateError

      toast.success(`Entrada registrada: +${formData.cantidad_laminas} láminas`)
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error creating entrada:', error)
      toast.error('Error al registrar entrada: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad_laminas' || name === 'precio_costo' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Entrada de Material</h1>
          <p className="page-subtitle">Registrar ingreso de láminas</p>
        </div>
      </div>

      {/* Material Info Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            {material.imagen_url ? (
              <img
                src={material.imagen_url}
                alt={material.nombre}
                className="w-20 h-20 object-cover rounded border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{material.nombre}</h2>
              <div className="mt-2 flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Stock Actual:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {material.cantidad_laminas} láminas
                  </span>
                  <span className="ml-1 text-gray-500">
                    (≈{(material.cantidad_laminas * LAMINA_ML).toFixed(2)} ml | {(material.cantidad_laminas * LAMINA_M2).toFixed(2)} m²)
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Precio Costo:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(material.precio_costo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Datos de la Entrada</h3>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Cantidad de Láminas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cantidad_laminas"
                value={formData.cantidad_laminas}
                onChange={handleChange}
                className="input"
                min="1"
                step="1"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                ≈ {(formData.cantidad_laminas * LAMINA_ML).toFixed(2)} ml | {(formData.cantidad_laminas * LAMINA_M2).toFixed(2)} m²
              </p>
            </div>

            <div>
              <label className="label">Precio de Costo (por lámina)</label>
              <input
                type="number"
                name="precio_costo"
                value={formData.precio_costo}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
              />
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(formData.precio_costo)}
              </p>
            </div>
          </div>

          {/* Preview del nuevo stock */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Nuevo Stock</p>
                <p className="text-2xl font-bold text-blue-600">
                  {material.cantidad_laminas + formData.cantidad_laminas} láminas
                </p>
                <p className="text-sm text-blue-700">
                  ≈ {((material.cantidad_laminas + formData.cantidad_laminas) * LAMINA_ML).toFixed(2)} ml | {((material.cantidad_laminas + formData.cantidad_laminas) * LAMINA_M2).toFixed(2)} m²
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Ingresando</p>
                <p className="text-xl font-semibold text-green-600">
                  +{formData.cantidad_laminas} láminas
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">
              Motivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              className="input"
              placeholder="Ej: Compra a proveedor, Devolución de cliente, Ajuste de inventario"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Proveedor</label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del proveedor"
              />
            </div>

            <div>
              <label className="label">Factura/Orden</label>
              <input
                type="text"
                name="factura"
                value={formData.factura}
                onChange={handleChange}
                className="input"
                placeholder="Número de factura"
              />
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-end gap-3">
          <Link href="/inventario" className="btn btn-ghost">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-success">
            {loading ? (
              <>
                <div className="spinner"></div>
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Registrar Entrada
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
