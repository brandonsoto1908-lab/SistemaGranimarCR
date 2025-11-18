// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react'

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
  created_at: string
}

interface Stats {
  totalFacturas: number
  facturasPendientes: number
  facturasAbonadas: number
  facturasPagadas: number
  totalFacturado: number
  totalCobrado: number
  totalPendiente: number
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes')
  const [stats, setStats] = useState<Stats>({
    totalFacturas: 0,
    facturasPendientes: 0,
    facturasAbonadas: 0,
    facturasPagadas: 0,
    totalFacturado: 0,
    totalCobrado: 0,
    totalPendiente: 0
  })

  useEffect(() => {
    fetchFacturas()
  }, [filtroEstado, filtroPeriodo])

  const fetchFacturas = async () => {
    try {
      let query = supabase
        .from('facturacion')
        .select('*')
        .order('fecha_factura', { ascending: false })

      // Filtrar por estado
      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado)
      }

      // Filtrar por periodo
      const ahora = new Date()
      if (filtroPeriodo === 'semana') {
        const haceUnaSemana = new Date(ahora)
        haceUnaSemana.setDate(ahora.getDate() - 7)
        query = query.gte('fecha_factura', haceUnaSemana.toISOString().split('T')[0])
      } else if (filtroPeriodo === 'mes') {
        const haceUnMes = new Date(ahora)
        haceUnMes.setMonth(ahora.getMonth() - 1)
        query = query.gte('fecha_factura', haceUnMes.toISOString().split('T')[0])
      } else if (filtroPeriodo === 'quincena') {
        const haceQuinceDias = new Date(ahora)
        haceQuinceDias.setDate(ahora.getDate() - 15)
        query = query.gte('fecha_factura', haceQuinceDias.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error

      setFacturas(data || [])

      // Calcular estadísticas
      if (data) {
        const pendientes = data.filter(f => f.estado === 'pendiente')
        const abonadas = data.filter(f => f.estado === 'abonado')
        const pagadas = data.filter(f => f.estado === 'pagado')

        setStats({
          totalFacturas: data.length,
          facturasPendientes: pendientes.length,
          facturasAbonadas: abonadas.length,
          facturasPagadas: pagadas.length,
          totalFacturado: data.reduce((sum, f) => sum + f.monto_total, 0),
          totalCobrado: data.reduce((sum, f) => sum + f.monto_pagado, 0),
          totalPendiente: data.reduce((sum, f) => sum + f.monto_pendiente, 0)
        })
      }
    } catch (error) {
      console.error('Error fetching facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'badge-success'
      case 'abonado':
        return 'badge-warning'
      case 'pendiente':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'abonado':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'pendiente':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturación y Cobros</h1>
          <p className="page-subtitle">
            Gestión de facturas, pagos y abonos por proyecto
          </p>
        </div>
        <Link href="/facturacion/nueva" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nueva Factura
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Facturado</p>
              <p className="stat-value text-blue-600">{formatCurrency(stats.totalFacturado)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalFacturas} facturas</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Cobrado</p>
              <p className="stat-value text-green-600">{formatCurrency(stats.totalCobrado)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.facturasPagadas} pagadas</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Pendiente</p>
              <p className="stat-value text-red-600">{formatCurrency(stats.totalPendiente)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.facturasPendientes} pendientes</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Con Abonos</p>
              <p className="stat-value text-yellow-600">{stats.facturasAbonadas}</p>
              <p className="text-xs text-gray-500 mt-1">Parcialmente pagadas</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Filtrar por estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="input"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="abonado">Abonados</option>
                <option value="pagado">Pagados</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="label">Periodo</label>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="input"
              >
                <option value="todos">Todos los periodos</option>
                <option value="semana">Última semana</option>
                <option value="quincena">Última quincena</option>
                <option value="mes">Último mes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="btn btn-secondary">
                <Download className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Facturas</h2>
        </div>
        <div className="card-body p-0">
          {facturas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay facturas para mostrar</p>
              <Link href="/facturacion/nueva" className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Crear Primera Factura
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Proyecto</th>
                    <th>Cliente</th>
                    <th>Monto Total</th>
                    <th>Pagado</th>
                    <th>Pendiente</th>
                    <th>% Pagado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(factura.estado)}
                          <span className={`badge ${getEstadoBadge(factura.estado)}`}>
                            {factura.estado}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link 
                          href={`/facturacion/${factura.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {factura.proyecto}
                        </Link>
                      </td>
                      <td className="text-gray-700">{factura.cliente}</td>
                      <td className="font-semibold">{formatCurrency(factura.monto_total)}</td>
                      <td className="text-green-600 font-medium">
                        {formatCurrency(factura.monto_pagado)}
                      </td>
                      <td className="text-red-600 font-medium">
                        {formatCurrency(factura.monto_pendiente)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                factura.porcentaje_pagado === 100 ? 'bg-green-600' :
                                factura.porcentaje_pagado > 0 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${factura.porcentaje_pagado}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {formatNumber(factura.porcentaje_pagado)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-gray-500 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(factura.fecha_factura).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/facturacion/${factura.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            Ver Detalles
                          </Link>
                          {factura.estado !== 'pagado' && (
                            <Link
                              href={`/facturacion/${factura.id}/pagar`}
                              className="btn btn-sm btn-success"
                            >
                              <DollarSign className="w-4 h-4" />
                              Pagar
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Resumen por periodo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="card-body">
            <h3 className="font-semibold text-blue-900 mb-2">Semana Actual</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(
                facturas
                  .filter(f => {
                    const fecha = new Date(f.fecha_factura)
                    const haceUnaSemana = new Date()
                    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7)
                    return fecha >= haceUnaSemana
                  })
                  .reduce((sum, f) => sum + f.monto_pagado, 0)
              )}
            </p>
            <p className="text-sm text-blue-600 mt-1">Cobrado en última semana</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="card-body">
            <h3 className="font-semibold text-green-900 mb-2">Mes Actual</h3>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(
                facturas
                  .filter(f => {
                    const fecha = new Date(f.fecha_factura)
                    const haceUnMes = new Date()
                    haceUnMes.setMonth(haceUnMes.getMonth() - 1)
                    return fecha >= haceUnMes
                  })
                  .reduce((sum, f) => sum + f.monto_pagado, 0)
              )}
            </p>
            <p className="text-sm text-green-600 mt-1">Cobrado en último mes</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="card-body">
            <h3 className="font-semibold text-purple-900 mb-2">Tasa de Cobro</h3>
            <p className="text-2xl font-bold text-purple-700">
              {stats.totalFacturado > 0 
                ? formatNumber((stats.totalCobrado / stats.totalFacturado) * 100) 
                : 0}%
            </p>
            <p className="text-sm text-purple-600 mt-1">Del total facturado</p>
          </div>
        </div>
      </div>
    </div>
  )
}
