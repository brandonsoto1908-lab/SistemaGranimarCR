// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { generarPDFFactura } from '@/lib/pdfGenerator'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Download,
  Calendar,
  User,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'

interface Factura {
  id: string
  retiro_id: string
  proyecto: string
  cliente: string
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  estado: string
  porcentaje_pagado: number
  fecha_factura: string
  fecha_pago_completo: string | null
  notas: string
  created_at: string
}

interface Pago {
  id: string
  factura_id: string
  monto: number
  tipo_pago: string
  referencia: string
  fecha_pago: string
  notas: string
  created_at: string
}

export default function DetalleFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const facturaId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [factura, setFactura] = useState<Factura | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])

  useEffect(() => {
    if (facturaId) {
      fetchFactura()
      fetchPagos()
    }
  }, [facturaId])

  const fetchFactura = async () => {
    try {
      const { data, error } = await supabase
        .from('facturacion')
        .select('*')
        .eq('id', facturaId)
        .single()

      if (error) throw error
      setFactura(data)
    } catch (error) {
      console.error('Error fetching factura:', error)
      toast.error('Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  const fetchPagos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('factura_id', facturaId)
        .order('fecha_pago', { ascending: false })

      if (error) throw error
      setPagos(data || [])
    } catch (error) {
      console.error('Error fetching pagos:', error)
    }
  }

  const handleDescargarPDF = () => {
    if (!factura) return
    
    try {
      generarPDFFactura(factura, pagos)
      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          badge: 'badge-success',
          color: 'text-green-700',
          bgColor: 'bg-green-50 border-green-200',
          texto: 'Pagado Completamente'
        }
      case 'abonado':
        return {
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
          badge: 'badge-warning',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50 border-yellow-200',
          texto: 'Pago Parcial'
        }
      case 'pendiente':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          badge: 'badge-danger',
          color: 'text-red-700',
          bgColor: 'bg-red-50 border-red-200',
          texto: 'Pendiente de Pago'
        }
      default:
        return {
          icon: null,
          badge: 'badge-secondary',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50 border-gray-200',
          texto: estado
        }
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

  const estadoInfo = getEstadoInfo(factura.estado)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/facturacion" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Factura #{factura.id.slice(0, 8)}</h1>
          <p className="page-subtitle">{factura.proyecto}</p>
        </div>
        <button onClick={handleDescargarPDF} className="btn btn-secondary">
          <Download className="w-5 h-5" />
          Descargar PDF
        </button>
      </div>

      {/* Estado de la Factura */}
      <div className={`card border-2 ${estadoInfo.bgColor}`}>
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {estadoInfo.icon}
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`text-2xl font-bold ${estadoInfo.color}`}>
                  {estadoInfo.texto}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Porcentaje Pagado</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      factura.porcentaje_pagado === 100 ? 'bg-green-600' :
                      factura.porcentaje_pagado > 0 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${factura.porcentaje_pagado}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(factura.porcentaje_pagado)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la Factura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del Cliente */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Cliente
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{factura.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Proyecto</p>
                <p className="font-semibold text-gray-900">{factura.proyecto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Factura</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(factura.fecha_factura).toLocaleDateString()}
                </p>
              </div>
              {factura.fecha_pago_completo && (
                <div>
                  <p className="text-sm text-gray-600">Fecha de Pago Completo</p>
                  <p className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {new Date(factura.fecha_pago_completo).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de Montos */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumen de Montos
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-700">Monto Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(factura.monto_total)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-700">Monto Pagado</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(factura.monto_pagado)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">Monto Pendiente</span>
                <span className={`text-2xl font-bold ${
                  factura.monto_pendiente > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(factura.monto_pendiente)}
                </span>
              </div>
            </div>

            {factura.estado !== 'pagado' && (
              <Link
                href={`/facturacion/${factura.id}/pagar`}
                className="btn btn-success w-full mt-4"
              >
                <DollarSign className="w-5 h-5" />
                Registrar Pago/Abono
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Historial de Pagos ({pagos.length})
          </h2>
        </div>
        <div className="card-body p-0">
          {pagos.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay pagos registrados</p>
              {factura.estado !== 'pagado' && (
                <Link
                  href={`/facturacion/${factura.id}/pagar`}
                  className="btn btn-primary"
                >
                  <DollarSign className="w-5 h-5" />
                  Registrar Primer Pago
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Tipo de Pago</th>
                    <th>Referencia</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {new Date(pago.fecha_pago).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-green-600">
                        {formatCurrency(pago.monto)}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {pago.tipo_pago}
                        </span>
                      </td>
                      <td className="text-gray-700">
                        {pago.referencia || '-'}
                      </td>
                      <td className="text-gray-600 text-sm">
                        {pago.notas || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      {factura.notas && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold mb-3">Notas Adicionales</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{factura.notas}</p>
          </div>
        </div>
      )}
    </div>
  )
}
