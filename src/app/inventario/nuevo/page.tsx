'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NuevoMaterialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad_medida: 'lámina',
    cantidad_actual: 0,
    cantidad_minima: 0,
    precio_unitario: 0,
    ubicacion_fisica: '',
    notas: '',
  })

  const categorias = [
    'Piedra',
    'Cuarzo',
    'Mármol',
    'Porcelánico',
    'Consumible',
    'Herramienta',
    'Otro',
  ]

  const unidades = [
    'lámina',
    'kg',
    'unidad',
    'metro',
    'metro cuadrado',
    'litro',
    'caja',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('materiales')
        .insert([formData])

      if (error) throw error

      toast.success('Material creado exitosamente')
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error creating material:', error)
      toast.error('Error al crear material: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['cantidad_actual', 'cantidad_minima', 'precio_unitario'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Material</h1>
          <p className="page-subtitle">Agregar material al inventario</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label label-required">Nombre del Material</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Granito Negro Galaxy"
                  required
                />
              </div>

              <div>
                <label className="label">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Unidad de Medida</label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="input"
                >
                  {unidades.map(unidad => (
                    <option key={unidad} value={unidad}>{unidad}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Stock e Inventario */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Stock e Inventario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Cantidad Actual</label>
                <input
                  type="number"
                  name="cantidad_actual"
                  value={formData.cantidad_actual}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Cantidad Mínima</label>
                <input
                  type="number"
                  name="cantidad_minima"
                  value={formData.cantidad_minima}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alerta cuando el stock esté por debajo
                </p>
              </div>

              <div>
                <label className="label">Precio Unitario (₡)</label>
                <input
                  type="number"
                  name="precio_unitario"
                  value={formData.precio_unitario}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Información Adicional */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Adicional
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Ubicación Física</label>
                <input
                  type="text"
                  name="ubicacion_fisica"
                  value={formData.ubicacion_fisica}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Bodega A, Estante 3"
                />
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  className="textarea"
                  rows={4}
                  placeholder="Información adicional sobre el material..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer flex justify-end gap-3">
          <Link href="/inventario" className="btn btn-ghost">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Material
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
