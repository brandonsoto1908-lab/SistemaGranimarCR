// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function EditarPrestamoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    concepto: '',
    acreedor: '',
    monto_total: 0,
    moneda: 'CRC',
    tasa_interes: 0,
    plazo_meses: 0,
    cuota_mensual: 0,
    fecha_prestamo: getDateInputValue(),
    fecha_vencimiento: '',
    categoria: '',
    registrar_en_gastos: false,
    notas: '',
  })

  const categorias = [
    'Personal',
    'Empresarial',
    'Bancario',
    'Proveedor',
    'Familiar',
    'Otros',
  ]

  useEffect(() => {
    if (id) {
      fetchPrestamo()
    }
  }, [id])

  const fetchPrestamo = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          concepto: data.concepto || '',
          acreedor: data.acreedor || '',
          monto_total: data.monto_total || 0,
          moneda: data.moneda || 'CRC',
          tasa_interes: data.tasa_interes || 0,
          plazo_meses: data.plazo_meses || 0,
          cuota_mensual: data.cuota_mensual || 0,
          fecha_prestamo: data.fecha_prestamo || getDateInputValue(),
          fecha_vencimiento: data.fecha_vencimiento || '',
          categoria: data.categoria || '',
          registrar_en_gastos: data.registrar_en_gastos || false,
          notas: data.notas || '',
        })
      }
    } catch (error: any) {
      console.error('Error fetching prestamo:', error)
      toast.error('Error al cargar préstamo')
    } finally {
      setLoadingData(false)
    }
  }

  const calcularCuotaMensual = () => {
    const { monto_total, tasa_interes, plazo_meses } = formData
    
    if (monto_total <= 0 || plazo_meses <= 0) {
      toast.error('Ingrese monto y plazo válidos')
      return
    }

    if (tasa_interes === 0) {
      const cuota = monto_total / plazo_meses
      setFormData(prev => ({ ...prev, cuota_mensual: parseFloat(cuota.toFixed(2)) }))
      toast.success('Cuota calculada (sin interés)')
      return
    }

    const tasaMensual = (tasa_interes / 100) / 12
    const cuota = monto_total * (tasaMensual * Math.pow(1 + tasaMensual, plazo_meses)) / 
                  (Math.pow(1 + tasaMensual, plazo_meses) - 1)
    
    setFormData(prev => ({ ...prev, cuota_mensual: parseFloat(cuota.toFixed(2)) }))
    toast.success('Cuota mensual calculada')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.concepto.trim()) {
      toast.error('El concepto es requerido')
      return
    }

    if (!formData.acreedor.trim()) {
      toast.error('El acreedor es requerido')
      return
    }

    if (formData.monto_total <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('prestamos')
        .update({
          ...formData,
          fecha_vencimiento: formData.fecha_vencimiento || null,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Préstamo actualizado exitosamente')
      router.push('/gastos/prestamos')
    } catch (error: any) {
      console.error('Error updating prestamo:', error)
      toast.error('Error al actualizar préstamo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value,
    }))
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/gastos/prestamos" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Editar Préstamo</h1>
          <p className="page-subtitle">Modificar información del préstamo</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Préstamo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label label-required">Concepto</label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Préstamo para capital de trabajo"
                  required
                />
              </div>

              <div>
                <label className="label label-required">Acreedor</label>
                <input
                  type="text"
                  name="acreedor"
                  value={formData.acreedor}
                  onChange={handleChange}
                  className="input"
                  placeholder="Persona o institución"
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
            </div>
          </div>

          <div className="divider"></div>

          {/* Detalles Financieros */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles Financieros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Moneda</label>
                <select
                  name="moneda"
                  value={formData.moneda}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="CRC">₡ Colones (CRC)</option>
                  <option value="USD">$ Dólares (USD)</option>
                </select>
              </div>

              <div>
                <label className="label label-required">
                  Monto Total ({formData.moneda === 'USD' ? '$' : '₡'})
                </label>
                <input
                  type="number"
                  name="monto_total"
                  value={formData.monto_total}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="label">Tasa de Interés (%)</label>
                <input
                  type="number"
                  name="tasa_interes"
                  value={formData.tasa_interes}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                  placeholder="0 = sin interés"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tasa de interés anual. Dejar en 0 si no aplica.
                </p>
              </div>

              <div>
                <label className="label">Plazo (meses)</label>
                <input
                  type="number"
                  name="plazo_meses"
                  value={formData.plazo_meses}
                  onChange={handleChange}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">
                  Cuota Mensual ({formData.moneda === 'USD' ? '$' : '₡'})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="cuota_mensual"
                    value={formData.cuota_mensual}
                    onChange={handleChange}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={calcularCuotaMensual}
                    className="btn btn-secondary"
                    title="Calcular cuota"
                  >
                    <Calculator className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Fechas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Fechas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label label-required">Fecha del Préstamo</label>
                <input
                  type="date"
                  name="fecha_prestamo"
                  value={formData.fecha_prestamo}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Registrar en Gastos */}
          <div>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="registrar_en_gastos"
                  checked={formData.registrar_en_gastos}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Registrar Abonos como Gastos
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Si activa esta opción, cada abono que realice a este préstamo se registrará automáticamente como un gasto en el módulo de Gastos.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="divider"></div>

          {/* Notas */}
          <div>
            <label className="label">Notas Adicionales</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="textarea"
              rows={4}
              placeholder="Información adicional sobre el préstamo, términos especiales, etc..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer flex justify-end gap-3">
          <Link href="/gastos/prestamos" className="btn btn-ghost">
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
                Actualizando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
