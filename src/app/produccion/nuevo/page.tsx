'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMonthYear, getDateInputValue, generateCode, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function NuevaProduccionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calcularCostoFijo, setCalcularCostoFijo] = useState(false)
  const [costoFijoCalculado, setCostoFijoCalculado] = useState(0)
  const [calculando, setCalculando] = useState(false)
  const [formData, setFormData] = useState({
    codigo_sobre: generateCode('PROD-'),
    cliente: '',
    tipo_material: '',
    metros_lineales: 0,
    fecha_produccion: getDateInputValue(),
    costo_materiales: 0,
    costo_mano_obra: 0,
    estado: 'en_proceso',
    notas: '',
  })

  const tiposMaterial = [
    'Granito',
    'Cuarzo',
    'Mármol',
    'Porcelánico',
    'Otro',
  ]

  const estados = [
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'completado', label: 'Completado' },
    { value: 'entregado', label: 'Entregado' },
  ]

  useEffect(() => {
    if (calcularCostoFijo && formData.metros_lineales > 0) {
      calcularCostoFijoPorMetro()
    } else {
      setCostoFijoCalculado(0)
    }
  }, [calcularCostoFijo, formData.metros_lineales, formData.fecha_produccion])

  const calcularCostoFijoPorMetro = async () => {
    setCalculando(true)
    try {
      const { mes, anio } = getMonthYear(formData.fecha_produccion)
      
      const { data, error } = await supabase
        .rpc('calcular_costo_fijo_por_metro', {
          p_year: anio,
          p_month: mes,
          p_metros_lineales: formData.metros_lineales
        })

      if (error) throw error
      
      setCostoFijoCalculado(data || 0)
    } catch (error) {
      console.error('Error calculating fixed cost:', error)
      setCostoFijoCalculado(0)
    } finally {
      setCalculando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    if (formData.metros_lineales <= 0) {
      toast.error('Los metros lineales deben ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const { mes, anio } = getMonthYear(formData.fecha_produccion)
      
      const { error } = await supabase
        .from('produccion')
        .insert([{
          ...formData,
          mes,
          anio,
          costo_fijo_asignado: calcularCostoFijo ? costoFijoCalculado : 0,
        }])

      if (error) throw error

      toast.success('Orden de producción creada exitosamente')
      router.push('/produccion')
    } catch (error: any) {
      console.error('Error creating produccion:', error)
      toast.error('Error al crear orden: ' + error.message)
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
      [name]: ['metros_lineales', 'costo_materiales', 'costo_mano_obra'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }))
  }

  const costoTotal = formData.costo_materiales + formData.costo_mano_obra + 
    (calcularCostoFijo ? costoFijoCalculado : 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/produccion" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nueva Orden de Producción</h1>
          <p className="page-subtitle">Registrar nueva orden</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información de la Orden
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Código de Sobre</label>
                <input
                  type="text"
                  name="codigo_sobre"
                  value={formData.codigo_sobre}
                  onChange={handleChange}
                  className="input font-mono"
                  readOnly
                />
              </div>

              <div>
                <label className="label label-required">Cliente</label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className="input"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <label className="label">Tipo de Material</label>
                <select
                  name="tipo_material"
                  value={formData.tipo_material}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Seleccionar material</option>
                  {tiposMaterial.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label label-required">Metros Lineales</label>
                <input
                  type="number"
                  name="metros_lineales"
                  value={formData.metros_lineales}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="label label-required">Fecha de Producción</label>
                <input
                  type="date"
                  name="fecha_produccion"
                  value={formData.fecha_produccion}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="input"
                >
                  {estados.map(est => (
                    <option key={est.value} value={est.value}>{est.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Costos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Costos de Producción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Costo de Materiales (₡)</label>
                <input
                  type="number"
                  name="costo_materiales"
                  value={formData.costo_materiales}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Costo de Mano de Obra (₡)</label>
                <input
                  type="number"
                  name="costo_mano_obra"
                  value={formData.costo_mano_obra}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Costos Fijos */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border border-teal-200">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="calcular_costo_fijo"
                checked={calcularCostoFijo}
                onChange={(e) => setCalcularCostoFijo(e.target.checked)}
                className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <label htmlFor="calcular_costo_fijo" className="font-medium text-gray-900 cursor-pointer">
                  Incluir Gastos Fijos en el Cálculo
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Los gastos fijos del mes se distribuirán proporcionalmente según los metros lineales de esta orden.
                </p>
              </div>
            </div>

            {calcularCostoFijo && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-600" />
                    <span className="font-medium text-gray-900">Costo Fijo Asignado:</span>
                  </div>
                  <span className="text-xl font-bold text-teal-600">
                    {calculando ? (
                      <div className="spinner spinner-sm"></div>
                    ) : (
                      formatCurrency(costoFijoCalculado)
                    )}
                  </span>
                </div>
                {formData.metros_lineales > 0 && costoFijoCalculado > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Costo por metro: {formatCurrency(costoFijoCalculado / formData.metros_lineales)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Resumen de Costos */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen de Costos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Materiales:</span>
                <span className="font-medium">{formatCurrency(formData.costo_materiales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mano de Obra:</span>
                <span className="font-medium">{formatCurrency(formData.costo_mano_obra)}</span>
              </div>
              {calcularCostoFijo && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos Fijos:</span>
                  <span className="font-medium">{formatCurrency(costoFijoCalculado)}</span>
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Costo Total:</span>
                <span className="text-teal-600">{formatCurrency(costoTotal)}</span>
              </div>
              {formData.metros_lineales > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Costo por Metro:</span>
                  <span>{formatCurrency(costoTotal / formData.metros_lineales)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="divider"></div>

          {/* Notas */}
          <div>
            <label className="label">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="textarea"
              rows={4}
              placeholder="Información adicional sobre la orden..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer flex justify-end gap-3">
          <Link href="/produccion" className="btn btn-ghost">
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
                Crear Orden
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
