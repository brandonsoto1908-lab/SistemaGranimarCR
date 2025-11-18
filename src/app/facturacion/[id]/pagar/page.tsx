// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  DollarSign, 
  CreditCard,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface Factura {
  id: string
  proyecto: string
  cliente: string
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  estado: string
}

export default function RegistrarPagoPage() {
  const params = useParams()
  const router = useRouter()
  const facturaId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [factura, setFactura] = useState<Factura | null>(null)
  const [tipoPago, setTipoPago] = useState<'completo' | 'abono'>('abono')
  
  const [formData, setFormData] = useState({
    monto: 0,
    tipo_pago: 'efectivo',
    referencia: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    notas: ''
  })

  useEffect(() => {
    if (facturaId) {
      fetchFactura()
    }
  }, [facturaId])

  useEffect(() => {
    if (factura && tipoPago === 'completo') {
      setFormData(prev => ({
        ...prev,
        monto: factura.monto_pendiente
      }))
    }
  }, [tipoPago, factura])

  const fetchFactura = async () => {
    try {
      const { data, error } = await supabase
        .from('facturacion')
        .select('id, proyecto, cliente, monto_total, monto_pagado, monto_pendiente, estado')
        .eq('id', facturaId)
        .single()

      if (error) throw error
      
      if (data.estado === 'pagado') {
        toast.error('Esta factura ya está pagada completamente')
        router.push(`/facturacion/${facturaId}`)
        return
      }
      
      setFactura(data)
      setFormData(prev => ({
        ...prev,
        monto: data.monto_pendiente
      }))
    } catch (error) {
      console.error('Error fetching factura:', error)
      toast.error('Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!factura) return

    // Validaciones
    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (formData.monto > factura.monto_pendiente) {
      toast.error('El monto no puede ser mayor al monto pendiente')
      return
    }

    if (!formData.fecha_pago) {
      toast.error('La fecha de pago es requerida')
      return
    }

    setSaving(true)

    try {
      // Insertar el pago
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
          factura_id: facturaId,
          monto: formData.monto,
          tipo_pago: formData.tipo_pago,
          referencia: formData.referencia || null,
          fecha_pago: formData.fecha_pago,
          notas: formData.notas || null
        })

      if (pagoError) throw pagoError

      toast.success('Pago registrado correctamente')
      router.push(`/facturacion/${facturaId}`)
    } catch (error) {
      console.error('Error registrando pago:', error)
      toast.error('Error al registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Factura no encontrada</p>
        <Link href="/facturacion" className="btn btn-primary">
          Volver a Facturación
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/facturacion/${facturaId}`} className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Registrar Pago</h1>
          <p className="page-subtitle">{factura.proyecto} - {factura.cliente}</p>
        </div>
      </div>

      {/* Información de la Factura */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card bg-blue-50">
              <div className="stat-icon bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="stat-label">Monto Total</p>
                <p className="stat-value text-gray-900">{formatCurrency(factura.monto_total)}</p>
              </div>
            </div>
            
            <div className="stat-card bg-green-50">
              <div className="stat-icon bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="stat-label">Monto Pagado</p>
                <p className="stat-value text-green-600">{formatCurrency(factura.monto_pagado)}</p>
              </div>
            </div>
            
            <div className="stat-card bg-red-50">
              <div className="stat-icon bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="stat-label">Monto Pendiente</p>
                <p className="stat-value text-red-600">{formatCurrency(factura.monto_pendiente)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Pago */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Pago */}
        <div className="card">
          <div className="card-body">
            <label className="form-label">Tipo de Pago</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipoPago('completo')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  tipoPago === 'completo'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                  tipoPago === 'completo' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className="font-semibold">Pago Completo</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(factura.monto_pendiente)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTipoPago('abono')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  tipoPago === 'abono'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                  tipoPago === 'abono' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <p className="font-semibold">Abono Parcial</p>
                <p className="text-sm text-gray-600 mt-1">
                  Monto personalizado
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Detalles del Pago */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold">Detalles del Pago</h2>

            {/* Monto */}
            <div>
              <label htmlFor="monto" className="form-label required">
                Monto
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="monto"
                  step="0.01"
                  min="0"
                  max={factura.monto_pendiente}
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                  className="input pl-10"
                  disabled={tipoPago === 'completo'}
                  required
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Máximo: {formatCurrency(factura.monto_pendiente)}
              </p>
            </div>

            {/* Método de Pago */}
            <div>
              <label htmlFor="tipo_pago" className="form-label required">
                Método de Pago
              </label>
              <select
                id="tipo_pago"
                value={formData.tipo_pago}
                onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                className="input"
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="sinpe">SINPE Móvil</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Referencia */}
            <div>
              <label htmlFor="referencia" className="form-label">
                Referencia/Comprobante
              </label>
              <input
                type="text"
                id="referencia"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                className="input"
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>

            {/* Fecha de Pago */}
            <div>
              <label htmlFor="fecha_pago" className="form-label required">
                Fecha de Pago
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  id="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notas" className="form-label">
                Notas Adicionales
              </label>
              <textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
                className="input"
                placeholder="Información adicional sobre el pago..."
              />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <div className="card-body">
            <h2 className="text-lg font-semibold mb-4">Resumen del Pago</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                <span className="text-gray-700">Monto a Pagar</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(formData.monto)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                <span className="text-gray-700">Saldo Restante</span>
                <span className={`text-xl font-bold ${
                  (factura.monto_pendiente - formData.monto) === 0 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {formatCurrency(factura.monto_pendiente - formData.monto)}
                </span>
              </div>
              {(factura.monto_pendiente - formData.monto) === 0 && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 font-medium">
                    Este pago completará la factura al 100%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <Link href={`/facturacion/${facturaId}`} className="btn btn-secondary flex-1">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex-1"
          >
            {saving ? (
              <>
                <div className="spinner spinner-sm"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Registrar Pago
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
