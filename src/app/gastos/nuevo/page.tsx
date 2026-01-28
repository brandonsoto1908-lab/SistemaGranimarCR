// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMonthYear, getDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Proveedor {
  id: string
  nombre: string
}

export default function NuevoGastoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [formData, setFormData] = useState({
    concepto: '',
    categoria: '',
    monto: 0,
    moneda: 'CRC',
    es_fijo: false,
    is_planilla: false,
    frecuencia_pago: '',
    proxima_fecha_pago: '',
    fecha: getDateInputValue(),
    proveedor_id: '',
    notas: '',
  })

  useEffect(() => {
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .order('nombre')

      if (error) throw error
      setProveedores(data || [])
    } catch (error) {
      console.error('Error fetching proveedores:', error)
    }
  }

  const categorias = [
    'Servicios',
    'Transporte',
    'Mantenimiento',
    'Materia Prima',
    'Herramientas',
    'Administrativo',
    'Otros',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.concepto.trim()) {
      toast.error('El concepto es requerido')
      return
    }

    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const { mes, anio } = getMonthYear(formData.fecha)
      
      const { error } = await supabase
        .from('gastos')
        .insert([{
          ...formData,
          mes,
          anio,
          proveedor_id: formData.proveedor_id || null,
          is_planilla: formData.is_planilla || false,
          frecuencia_pago: formData.frecuencia_pago || null,
          proxima_fecha_pago: formData.proxima_fecha_pago || null,
        }] as any)

      if (error) throw error

      toast.success('Gasto registrado exitosamente')
      router.push('/gastos')
    } catch (error: any) {
      console.error('Error creating gasto:', error)
      toast.error('Error al crear gasto: ' + error.message)
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/gastos" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Gasto</h1>
          <p className="page-subtitle">Registrar gasto operativo</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Gasto
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
                  placeholder="Ej: Electricidad del mes"
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
                <label className="label">Proveedor</label>
                <select
                  name="proveedor_id"
                  value={formData.proveedor_id}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

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
                  Monto ({formData.moneda === 'USD' ? '$' : '₡'})
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="label label-required">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Tipo de Gasto */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tipo de Gasto
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="es_fijo"
                  checked={formData.es_fijo}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Marcar como Gasto Fijo
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Los gastos fijos se distribuyen proporcionalmente en las órdenes de producción según los metros lineales. 
                    Ejemplos: electricidad, agua, renta, salarios.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="divider"></div>

          {/* Planilla (opcional) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planilla</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_planilla"
                  checked={formData.is_planilla}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-teal-600"
                />
                <span className="font-medium">Es Planilla (pago recurrente)</span>
              </label>

              <div>
                <label className="label">Frecuencia de pago</label>
                <select
                  name="frecuencia_pago"
                  value={formData.frecuencia_pago}
                  onChange={handleChange}
                  className="input"
                  disabled={!formData.is_planilla}
                >
                  <option value="">Seleccionar frecuencia</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="bisemanal">Bisemanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div>
                <label className="label">Próxima fecha de pago</label>
                <input
                  type="date"
                  name="proxima_fecha_pago"
                  value={formData.proxima_fecha_pago}
                  onChange={handleChange}
                  className="input"
                  disabled={!formData.is_planilla}
                />
              </div>
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
              placeholder="Información adicional sobre el gasto..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer flex justify-end gap-3">
          <Link href="/gastos" className="btn btn-ghost">
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
                Guardar Gasto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
