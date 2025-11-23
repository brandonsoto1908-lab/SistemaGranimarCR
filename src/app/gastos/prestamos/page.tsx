// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  Plus, 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  Edit,
  Trash2
} from 'lucide-react'

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
  categoria: string
  created_at: string
}

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    fetchPrestamos()
  }, [filtroEstado])

  const handleDelete = async (id: string, concepto: string) => {
    if (!confirm(`¿Está seguro de eliminar el préstamo "${concepto}"?\n\nEsto también eliminará todos los abonos asociados.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('prestamos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Préstamo eliminado exitosamente')
      fetchPrestamos()
    } catch (error: any) {
      console.error('Error deleting prestamo:', error)
      toast.error('Error al eliminar préstamo: ' + error.message)
    }
  }

  const fetchPrestamos = async () => {
    try {
      let query = supabase
        .from('prestamos')
        .select('*')
        .order('fecha_prestamo', { ascending: false })

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado)
      }

      const { data, error } = await query

      if (error) throw error
      setPrestamos(data || [])
    } catch (error) {
      console.error('Error fetching prestamos:', error)
      toast.error('Error al cargar préstamos')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'badge-success'
      case 'activo':
        return 'badge-info'
      case 'vencido':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'activo':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'vencido':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  // Calcular estadísticas
  const totalPrestamos = prestamos.reduce((sum, p) => sum + p.monto_total, 0)
  const totalPagado = prestamos.reduce((sum, p) => sum + p.monto_pagado, 0)
  const totalPendiente = prestamos.reduce((sum, p) => sum + p.monto_pendiente, 0)
  const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length
  const prestamosPagados = prestamos.filter(p => p.estado === 'pagado').length

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
          <h1 className="page-title">Préstamos</h1>
          <p className="page-subtitle">
            Gestión y seguimiento de préstamos con abonos
          </p>
        </div>
        <Link href="/gastos/prestamos/nuevo" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo Préstamo
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Préstamos</p>
              <p className="stat-value">{prestamos.length}</p>
            </div>
            <div className="stat-icon">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Préstamos Activos</p>
              <p className="stat-value text-blue-600">{prestamosActivos}</p>
            </div>
            <div className="stat-icon bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Monto Total</p>
              <p className="stat-value text-gray-900">{formatCurrency(totalPrestamos)}</p>
            </div>
            <div className="stat-icon bg-gray-100">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Pagado</p>
              <p className="stat-value text-green-600">{formatCurrency(totalPagado)}</p>
            </div>
            <div className="stat-icon bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Saldo Pendiente</p>
              <p className="stat-value text-red-600">{formatCurrency(totalPendiente)}</p>
            </div>
            <div className="stat-icon bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`btn btn-sm ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos ({prestamos.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activo')}
              className={`btn btn-sm ${filtroEstado === 'activo' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Activos ({prestamosActivos})
            </button>
            <button
              onClick={() => setFiltroEstado('pagado')}
              className={`btn btn-sm ${filtroEstado === 'pagado' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pagados ({prestamosPagados})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Préstamos */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Préstamos Registrados</h2>
        </div>
        <div className="card-body p-0">
          {prestamos.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay préstamos registrados</p>
              <Link href="/gastos/prestamos/nuevo" className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Registrar Primer Préstamo
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Acreedor</th>
                    <th>Concepto</th>
                    <th>Monto Total</th>
                    <th>Monto Pagado</th>
                    <th>Saldo Pendiente</th>
                    <th>Progreso</th>
                    <th>Tasa</th>
                    <th>Fecha Préstamo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamos.map((prestamo) => (
                    <tr key={prestamo.id} className="hover:bg-gray-50">
                      <td className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {prestamo.acreedor}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{prestamo.concepto}</p>
                          {prestamo.categoria && (
                            <span className="badge badge-secondary text-xs">
                              {prestamo.categoria}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-gray-900">
                          {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {prestamo.moneda === 'USD' ? 'USD' : 'CRC'}
                        </div>
                      </td>
                      <td className="font-semibold text-green-600">
                        {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pagado.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="font-semibold text-red-600">
                        {prestamo.moneda === 'USD' ? '$' : '₡'}{prestamo.monto_pendiente.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className="w-full">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  prestamo.porcentaje_pagado === 100 ? 'bg-green-600' :
                                  prestamo.porcentaje_pagado > 0 ? 'bg-blue-500' :
                                  'bg-gray-300'
                                }`}
                                style={{ width: `${prestamo.porcentaje_pagado}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 min-w-[45px]">
                              {formatNumber(prestamo.porcentaje_pagado)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-700">
                        {prestamo.tasa_interes}%
                      </td>
                      <td className="text-gray-500 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(prestamo.fecha_prestamo).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadge(prestamo.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(prestamo.estado)}
                          {prestamo.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/gastos/prestamos/${prestamo.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            Ver Detalles
                          </Link>
                          {prestamo.estado !== 'pagado' && (
                            <Link
                              href={`/gastos/prestamos/${prestamo.id}/abonar`}
                              className="btn btn-sm btn-success"
                            >
                              <DollarSign className="w-4 h-4" />
                              Abonar
                            </Link>
                          )}
                          <Link
                            href={`/gastos/prestamos/editar/${prestamo.id}`}
                            className="btn btn-sm btn-ghost text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(prestamo.id, prestamo.concepto)}
                            className="btn btn-sm btn-ghost text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  )
}
