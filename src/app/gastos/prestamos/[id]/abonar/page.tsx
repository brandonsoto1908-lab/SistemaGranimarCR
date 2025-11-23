// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'

interface Prestamo {
  id: string
  concepto: string
  acreedor: string
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  moneda: string
  tasa_interes: number
}

export default function AbonarPrestamoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [loading, setLoading] = useState(false)
  const [loadingPrestamo, setLoadingPrestamo] = useState(true)
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [formData, setFormData] = useState({
    monto: 0,
    monto_capital: 0,
    monto_interes: 0,
    moneda: 'CRC',
    tipo_pago: 'efectivo',
    referencia: '',
    fecha_abono: getDateInputValue(),
    notas: '',
  })

  useEffect(() => {
    if (id) {
      fetchPrestamo()
    }
  }, [id])

  const fetchPrestamo = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('id, concepto, acreedor, monto_total, monto_pagado, monto_pendiente, moneda, tasa_interes')
        .eq('id', id)
        .single()

      if (error) throw error
      setPrestamo(data)
      // Sincronizar moneda del formulario con el préstamo
      if (data) {
        setFormData(prev => ({ ...prev, moneda: data.moneda }))
      }
    } catch (error: any) {
      console.error('Error fetching prestamo:', error)
      toast.error('Error al cargar préstamo')
    } finally {
      setLoadingPrestamo(false)
    }
  }

  const distribuirAbono = () => {
    const { monto } = formData
    
    if (monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }

    if (!prestamo) return

    // Si hay tasa de interés, calcular proporción
    if (prestamo.tasa_interes > 0) {
      // Calcular interés sobre el saldo pendiente (mensual)
      const tasaMensual = (prestamo.tasa_interes / 100) / 12
      const intereses = prestamo.monto_pendiente * tasaMensual
      
      let monto_interes = 0
      let monto_capital = 0

      if (monto >= intereses) {
        // El abono cubre los intereses y algo de capital
        monto_interes = intereses
        monto_capital = monto - intereses
      } else {
        // El abono solo cubre parte de los intereses
        monto_interes = monto
        monto_capital = 0
      }

      setFormData(prev => ({
        ...prev,
        monto_capital: parseFloat(monto_capital.toFixed(2)),
        monto_interes: parseFloat(monto_interes.toFixed(2)),
      }))
      
      toast.success('Distribución calculada')
    } else {
      // Sin interés, todo va a capital
      setFormData(prev => ({
        ...prev,
        monto_capital: monto,
        monto_interes: 0,
      }))
      toast.success('Todo el monto va a capital')
    }
  }

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monto = parseFloat(e.target.value) || 0
    setFormData(prev => ({ ...prev, monto }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (formData.monto_capital + formData.monto_interes !== formData.monto) {
      toast.error('La suma de capital e interés debe ser igual al monto total')
      return
    }

    if (!prestamo) return

    if (formData.monto_capital > prestamo.monto_pendiente) {
      toast.error('El monto de capital excede el saldo pendiente')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('abonos_prestamos')
        .insert([{
          prestamo_id: id,
          ...formData,
          referencia: formData.referencia || null,
        }] as any)

      if (error) throw error

      toast.success('Abono registrado exitosamente')
      router.push(`/gastos/prestamos/${id}`)
    } catch (error: any) {
      console.error('Error creating abono:', error)
      toast.error('Error al registrar abono: ' + error.message)
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
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  if (loadingPrestamo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (!prestamo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Préstamo no encontrado</p>
        <Link href="/gastos/prestamos" className="btn btn-primary mt-4">
          Volver a Préstamos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/gastos/prestamos/${id}`} className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Registrar Abono</h1>
          <p className="page-subtitle">{prestamo.concepto}</p>
        </div>
      </div>

      {/* Info del Préstamo */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <h3 className="font-semibold text-gray-900 mb-3">Información del Préstamo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Acreedor</div>
              <div className="font-medium text-gray-900">{prestamo.acreedor}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Monto Total</div>
              <div className="font-medium text-gray-900">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Pagado</div>
              <div className="font-medium text-green-600">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pagado.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Saldo Pendiente</div>
              <div className="font-medium text-red-600">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pendiente.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Monto del Abono */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Monto del Abono
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label label-required">
                  Monto Total del Abono ({prestamo.moneda === 'USD' ? '$' : '₡'})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleMontoChange}
                    className="input"
                    step="0.01"
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={distribuirAbono}
                    className="btn btn-secondary"
                    title="Calcular distribución"
                  >
                    <Calculator className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use el botón para calcular automáticamente la distribución entre capital e interés.
                </p>
              </div>

              <div>
                <label className="label label-required">
                  Monto a Capital ({prestamo.moneda === 'USD' ? '$' : '₡'})
                </label>
                <input
                  type="number"
                  name="monto_capital"
                  value={formData.monto_capital}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                  max={prestamo.monto_pendiente}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Parte que reduce el saldo del préstamo.
                </p>
              </div>

              <div>
                <label className="label">
                  Monto a Interés ({prestamo.moneda === 'USD' ? '$' : '₡'})
                </label>
                <input
                  type="number"
                  name="monto_interes"
                  value={formData.monto_interes}
                  onChange={handleChange}
                  className="input"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Parte que cubre intereses (si aplica).
                </p>
              </div>
            </div>

            {/* Validación visual */}
            {formData.monto > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capital + Interés:</span>
                  <span className={`font-semibold ${
                    formData.monto_capital + formData.monto_interes === formData.monto 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(formData.monto_capital + formData.monto_interes)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Monto del abono:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(formData.monto)}
                  </span>
                </div>
                {formData.monto_capital + formData.monto_interes !== formData.monto && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ La suma debe ser igual al monto del abono
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="divider"></div>

          {/* Información del Pago */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo de Pago</label>
                <select
                  name="tipo_pago"
                  value={formData.tipo_pago}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="label">Referencia</label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  className="input"
                  placeholder="Número de comprobante, cheque, etc."
                />
              </div>

              <div>
                <label className="label label-required">Fecha del Abono</label>
                <input
                  type="date"
                  name="fecha_abono"
                  value={formData.fecha_abono}
                  onChange={handleChange}
                  className="input"
                  required
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
              rows={3}
              placeholder="Información adicional sobre este abono..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer flex justify-end gap-3">
          <Link href={`/gastos/prestamos/${id}`} className="btn btn-ghost">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || formData.monto_capital + formData.monto_interes !== formData.monto}
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
                Registrar Abono
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
