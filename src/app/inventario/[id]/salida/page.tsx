// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Minus, Package } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_costo: number
  imagen_url: string | null
}

export default function SalidaMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [material, setMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    cantidad_laminas: 0,
    motivo: '',
    proyecto: '',
    responsable: '',
  })

  const LAMINA_ML = 3.22 // metros lineales por lámina

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

    if (formData.cantidad_laminas > (material?.cantidad_laminas || 0)) {
      toast.error('La cantidad no puede ser mayor al stock disponible')
      return
    }

    if (!formData.motivo.trim()) {
      toast.error('El motivo es requerido')
      return
    }

    setLoading(true)
    try {
      // Actualizar stock del material
      const nuevaCantidad = (material?.cantidad_laminas || 0) - formData.cantidad_laminas
      
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ 
          cantidad_laminas: nuevaCantidad,
        })
        .eq('id', materialId)

      if (updateError) throw updateError

      toast.success(`Salida registrada: -${formData.cantidad_laminas} láminas`)
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error creating salida:', error)
      toast.error('Error al registrar salida: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad_laminas' ? parseFloat(value) || 0 : value
    }))
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  const stockRestante = material.cantidad_laminas - formData.cantidad_laminas
  const tieneStock = material.cantidad_laminas > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Salida de Material</h1>
          <p className="page-subtitle">Registrar retiro de láminas</p>
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
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{material.nombre}</h2>
              <div className="mt-2 flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Stock Disponible:</span>
                  <span className={`ml-2 font-semibold ${tieneStock ? 'text-gray-900' : 'text-red-600'}`}>
                    {material.cantidad_laminas} láminas
                  </span>
                  <span className="ml-1 text-gray-500">
                    ({(material.cantidad_laminas * LAMINA_ML).toFixed(2)} ml)
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

      {/* Sin stock warning */}
      {!tieneStock && (
        <div className="alert alert-error">
          <p className="font-semibold">⚠️ Sin Stock Disponible</p>
          <p className="text-sm">Este material no tiene láminas disponibles para retirar.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Datos de la Salida</h3>
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
                max={material.cantidad_laminas}
                step="1"
                required
                disabled={!tieneStock}
              />
              <p className="text-sm text-gray-600 mt-1">
                = {(formData.cantidad_laminas * LAMINA_ML).toFixed(2)} metros lineales
              </p>
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <label className="label">Valor del Retiro</label>
                <div className="input bg-gray-50 font-semibold text-gray-900">
                  {formatCurrency(formData.cantidad_laminas * material.precio_costo)}
                </div>
              </div>
            </div>
          </div>

          {/* Preview del stock restante */}
          <div className={`border rounded-lg p-4 ${
            stockRestante < 0 
              ? 'bg-red-50 border-red-200' 
              : stockRestante === 0 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  stockRestante < 0 ? 'text-red-900' : 'text-blue-900'
                }`}>
                  Stock Restante
                </p>
                <p className={`text-2xl font-bold ${
                  stockRestante < 0 
                    ? 'text-red-600' 
                    : stockRestante === 0 
                      ? 'text-amber-600' 
                      : 'text-blue-600'
                }`}>
                  {stockRestante} láminas
                </p>
                <p className={`text-sm ${
                  stockRestante < 0 ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {(stockRestante * LAMINA_ML).toFixed(2)} metros lineales
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${
                  stockRestante < 0 ? 'text-red-700' : 'text-blue-700'
                }`}>
                  Retirando
                </p>
                <p className="text-xl font-semibold text-red-600">
                  -{formData.cantidad_laminas} láminas
                </p>
              </div>
            </div>
            {stockRestante < 0 && (
              <p className="text-sm text-red-700 mt-2 font-medium">
                ⚠️ La cantidad excede el stock disponible
              </p>
            )}
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
              placeholder="Ej: Uso en proyecto, Venta a cliente, Traslado a bodega"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Proyecto</label>
              <input
                type="text"
                name="proyecto"
                value={formData.proyecto}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del proyecto"
              />
            </div>

            <div>
              <label className="label">Responsable</label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                className="input"
                placeholder="Quien retira el material"
              />
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-end gap-3">
          <Link href="/inventario" className="btn btn-ghost">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading || stockRestante < 0 || !tieneStock} 
            className="btn btn-warning"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
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
