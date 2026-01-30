// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp,
  Plus,
  CheckCircle
} from 'lucide-react'
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
  plazo_meses: number
  cuota_mensual: number
  estado: string
  porcentaje_pagado: number
  fecha_prestamo: string
  fecha_vencimiento: string | null
  fecha_pago_completo: string | null
  notas: string | null
  categoria: string | null
  created_at: string
}

interface Abono {
  id: string
  monto: number
  monto_capital: number
  monto_interes: number
  saldo_debito?: number | null
  poliza?: number | null
  tipo_pago: string
  referencia: string | null
  fecha_abono: string
  notas: string | null
  created_at: string
}

export default function PrestamoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [abonos, setAbonos] = useState<Abono[]>([])

  useEffect(() => {
    if (id) {
      fetchPrestamo()
      fetchAbonos()
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
      setPrestamo(data)
    } catch (error: any) {
      console.error('Error fetching prestamo:', error)
      toast.error('Error al cargar préstamo')
    } finally {
      setLoading(false)
    }
  }

  const fetchAbonos = async () => {
    try {
      const { data, error } = await supabase
        .from('abonos_prestamos')
        .select('*')
        .eq('prestamo_id', id)
        .order('fecha_abono', { ascending: false })

      if (error) throw error
      setAbonos(data || [])
    } catch (error: any) {
      console.error('Error fetching abonos:', error)
    }
  }

  if (loading) {
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'bg-green-100 text-green-800'
      case 'activo': return 'bg-blue-100 text-blue-800'
      case 'vencido': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalAbonosCapital = abonos.reduce((sum, a) => sum + a.monto_capital, 0)
  const totalAbonosInteres = abonos.reduce((sum, a) => sum + a.monto_interes, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gastos/prestamos" className="btn btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{prestamo.concepto}</h1>
            <p className="page-subtitle">Detalles del préstamo</p>
          </div>
        </div>
        <div className="flex gap-3">
          {prestamo.estado !== 'pagado' && (
            <Link
              href={`/gastos/prestamos/${id}/abonar`}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Registrar Abono
            </Link>
          )}
        </div>
      </div>

      {/* Estado Badge */}
      <div className="flex items-center gap-4">
        <span className={`badge ${getEstadoColor(prestamo.estado)} text-sm px-4 py-2`}>
          {prestamo.estado === 'pagado' && <CheckCircle className="w-4 h-4 mr-2" />}
          {prestamo.estado.toUpperCase()}
        </span>
        {prestamo.estado === 'pagado' && prestamo.fecha_pago_completo && (
          <span className="text-sm text-gray-600">
            Pagado el {new Date(prestamo.fecha_pago_completo).toLocaleDateString('es-CR')}
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Monto Total</div>
              <div className="stat-value text-gray-900">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Monto Pagado</div>
              <div className="stat-value text-green-600">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pagado.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Saldo Pendiente</div>
              <div className="stat-value text-red-600">
                {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pendiente.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Progreso</div>
              <div className="stat-value text-blue-600">
                {prestamo.porcentaje_pagado.toFixed(1)}%
              </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="relative w-full h-full">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - prestamo.porcentaje_pagado / 100)}`}
                    className="text-blue-600"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de Pago</span>
            <span className="text-sm font-semibold text-gray-900">
              {prestamo.porcentaje_pagado.toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(prestamo.porcentaje_pagado, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Información del Préstamo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles Generales */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información General
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Acreedor</div>
                  <div className="font-medium text-gray-900">{prestamo.acreedor}</div>
                </div>
              </div>

              {prestamo.categoria && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Categoría</div>
                    <span className="badge badge-secondary">{prestamo.categoria}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Fecha del Préstamo</div>
                  <div className="font-medium text-gray-900">
                    {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-CR')}
                  </div>
                </div>
              </div>

              {prestamo.fecha_vencimiento && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Fecha de Vencimiento</div>
                    <div className="font-medium text-gray-900">
                      {new Date(prestamo.fecha_vencimiento).toLocaleDateString('es-CR')}
                    </div>
                  </div>
                </div>
              )}

              {prestamo.notas && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Notas</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {prestamo.notas}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalles Financieros */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Detalles Financieros
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tasa de Interés</span>
                <span className="font-semibold text-gray-900">{prestamo.tasa_interes}% anual</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Plazo</span>
                <span className="font-semibold text-gray-900">{prestamo.plazo_meses} meses</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Cuota Mensual</span>
                <span className="font-semibold text-gray-900">
                  {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.cuota_mensual.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Abonos (Capital)</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalAbonosCapital)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Abonos (Interés)</span>
                <span className="font-semibold text-orange-600">{formatCurrency(totalAbonosInteres)}</span>
              </div>

              <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg">
                <span className="text-sm font-semibold text-blue-900">Total Pagado</span>
                <span className="font-bold text-blue-900">{formatCurrency(totalAbonosCapital + totalAbonosInteres)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Abonos */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Abonos ({abonos.length})
          </h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto Total</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Tipo de Pago</th>
                <th>Referencia</th>
                <th>Notas</th>
                    <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {abonos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No hay abonos registrados
                  </td>
                </tr>
              ) : (
                abonos.map((abono) => (
                  <tr key={abono.id}>
                    <td>{new Date(abono.fecha_abono).toLocaleDateString('es-CR')}</td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {prestamo.moneda === 'USD' ? '$' : '₡'}{abono.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className="text-green-600 font-medium">
                        {prestamo.moneda === 'USD' ? '$' : '₡'}{abono.monto_capital.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {abono.saldo_debito != null && (
                        <div className="text-xs text-gray-500 mt-1">Saldo Débito: {prestamo.moneda === 'USD' ? '$' : '₡'}{abono.saldo_debito.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                    </td>
                    <td>
                      <span className="text-orange-600 font-medium">
                        {prestamo.moneda === 'USD' ? '$' : '₡'}{abono.monto_interes.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {abono.poliza != null && (
                        <div className="text-xs text-gray-500 mt-1">Póliza: {prestamo.moneda === 'USD' ? '$' : '₡'}{abono.poliza.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-outline capitalize">
                        {abono.tipo_pago}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{abono.referencia || '-'}</td>
                    <td className="text-sm text-gray-600">{abono.notas || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/gastos/prestamos/${id}/abono/${abono.id}/editar`} className="btn btn-sm btn-ghost text-blue-600">Editar</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
