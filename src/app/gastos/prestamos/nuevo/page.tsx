// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPrestamoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    // Pago inicial (opcional) - se insertará en `abonos_prestamos` si hay valores
    initial_abono_monto_capital: 0,
    initial_abono_monto_interes: 0,
    initial_abono_saldo_debito: 0,
    initial_abono_poliza: 0,
    initial_abono_fecha: getDateInputValue(),
  })

  const categorias = [
    'Personal',
    'Empresarial',
    'Bancario',
    'Proveedor',
    'Familiar',
    'Otros',
  ]

  const calcularCuotaMensual = () => {
    const { monto_total, tasa_interes, plazo_meses } = formData
    
    if (monto_total <= 0 || plazo_meses <= 0) {
      toast.error('Ingrese monto y plazo válidos')
      return
    }

    if (tasa_interes === 0) {
      // Sin interés, dividir el monto entre los meses
      const cuota = monto_total / plazo_meses
      setFormData(prev => ({ ...prev, cuota_mensual: parseFloat(cuota.toFixed(2)) }))
      toast.success('Cuota calculada (sin interés)')
      return
    }

    // Calcular cuota con interés usando fórmula de amortización
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
      // Insertar préstamo y obtener el id del registro creado
      const { data: createdPrestamo, error: insertError } = await supabase
        .from('prestamos')
        .insert([
          {
            concepto: formData.concepto,
            acreedor: formData.acreedor,
            monto_total: formData.monto_total,
            moneda: formData.moneda,
            tasa_interes: formData.tasa_interes,
            plazo_meses: formData.plazo_meses,
            cuota_mensual: formData.cuota_mensual,
            fecha_prestamo: formData.fecha_prestamo,
            fecha_vencimiento: formData.fecha_vencimiento || null,
            categoria: formData.categoria || null,
            registrar_en_gastos: formData.registrar_en_gastos,
            notas: formData.notas || null,
          },
        ])
        .select('id')
        .single()

      if (insertError) throw insertError

      const prestamoId = createdPrestamo?.id

      // Si se ingresó un pago inicial, insertarlo en abonos_prestamos
      const hasInitialAbono = (
        parseFloat(String(formData.initial_abono_monto_capital || 0)) > 0 ||
        parseFloat(String(formData.initial_abono_monto_interes || 0)) > 0 ||
        parseFloat(String(formData.initial_abono_saldo_debito || 0)) > 0 ||
        parseFloat(String(formData.initial_abono_poliza || 0)) > 0
      )

      if (prestamoId && hasInitialAbono) {
        const montoCapital = parseFloat(String(formData.initial_abono_monto_capital || 0))
        const montoInteres = parseFloat(String(formData.initial_abono_monto_interes || 0))
        const montoTotalAbono = montoCapital + montoInteres

        const { error: abonoError } = await supabase
          .from('abonos_prestamos')
          .insert([
            {
              prestamo_id: prestamoId,
              monto: montoTotalAbono,
              monto_capital: montoCapital,
              monto_interes: montoInteres,
              saldo_debito: formData.initial_abono_saldo_debito || null,
              poliza: formData.initial_abono_poliza || null,
              fecha_abono: formData.initial_abono_fecha || null,
            },
          ])

        if (abonoError) throw abonoError
      }

      toast.success('Préstamo registrado exitosamente')
      router.push('/gastos/prestamos')
    } catch (error: any) {
      console.error('Error creating prestamo:', error)
      toast.error('Error al crear préstamo: ' + (error?.message || error))
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/gastos/prestamos" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Préstamo</h1>
          <p className="page-subtitle">Registrar préstamo recibido</p>
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

            {/* Pago inicial opcional */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-800">Pago inicial (opcional)</h3>
              <p className="text-xs text-gray-500 mb-2">Si desea registrar un abono inicial al crear el préstamo, ingrese los montos aquí.</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="label">Monto a Capital ({formData.moneda === 'USD' ? '$' : '₡'})</label>
                  <input type="number" name="initial_abono_monto_capital" value={formData.initial_abono_monto_capital} onChange={handleChange} className="input" step="0.01" min="0" />
                </div>

                <div>
                  <label className="label">Monto a Interés ({formData.moneda === 'USD' ? '$' : '₡'})</label>
                  <input type="number" name="initial_abono_monto_interes" value={formData.initial_abono_monto_interes} onChange={handleChange} className="input" step="0.01" min="0" />
                </div>

                <div>
                  <label className="label">Saldo Débito ({formData.moneda === 'USD' ? '$' : '₡'})</label>
                  <input type="number" name="initial_abono_saldo_debito" value={formData.initial_abono_saldo_debito} onChange={handleChange} className="input" step="0.01" min="0" />
                </div>

                <div>
                  <label className="label">Póliza</label>
                  <input type="number" name="initial_abono_poliza" value={formData.initial_abono_poliza} onChange={handleChange} className="input" step="0.01" min="0" />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Fecha del Abono</label>
                  <input type="date" name="initial_abono_fecha" value={formData.initial_abono_fecha} onChange={handleChange} className="input" />
                </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  Puede calcularse automáticamente o ingresar manualmente.
                </p>
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Préstamo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
