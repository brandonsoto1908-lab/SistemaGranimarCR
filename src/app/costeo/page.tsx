// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Calculator, TrendingUp, DollarSign, Clock, Package } from 'lucide-react'

interface CosteoProduccion {
  id: string
  retiro_id: string
  proyecto: string
  costo_material: number
  costo_mano_obra: number
  costo_insumos: number
  horas_trabajadas: number
  tarifa_hora: number
  costo_total: number
  precio_venta: number
  ganancia_total: number
  porcentaje_ganancia: number
  porcentaje_material: number
  porcentaje_mano_obra: number
  porcentaje_insumos: number
  porcentaje_ahorros: number
  created_at: string
}

export default function CosteoPage() {
  const [costeos, setCosteos] = useState<CosteoProduccion[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProyectos: 0,
    totalCostos: 0,
    totalVentas: 0,
    totalGanancias: 0,
    promedioGanancia: 0
  })

  useEffect(() => {
    fetchCosteos()
  }, [])

  const fetchCosteos = async () => {
    try {
      const { data, error } = await supabase
        .from('costeo_produccion')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCosteos(data || [])
      
      // Calcular estadísticas
      if (data && data.length > 0) {
        const totalCostos = data.reduce((sum, c) => sum + (c.costo_total || 0), 0)
        const totalVentas = data.reduce((sum, c) => sum + (c.precio_venta || 0), 0)
        const totalGanancias = data.reduce((sum, c) => sum + (c.ganancia_total || 0), 0)
        const promedioGanancia = data.reduce((sum, c) => sum + (c.porcentaje_ganancia || 0), 0) / data.length

        setStats({
          totalProyectos: data.length,
          totalCostos,
          totalVentas,
          totalGanancias,
          promedioGanancia
        })
      }
    } catch (error) {
      console.error('Error fetching costeos:', error)
    } finally {
      setLoading(false)
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
          <h1 className="page-title">Costeo de Producción</h1>
          <p className="page-subtitle">
            Gestión detallada de costos y rentabilidad por proyecto
          </p>
        </div>
        <Link href="/costeo/nuevo" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo Costeo
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Proyectos</p>
              <p className="stat-value">{stats.totalProyectos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Costos Totales</p>
              <p className="stat-value text-red-600">{formatCurrency(stats.totalCostos)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Ventas Totales</p>
              <p className="stat-value text-green-600">{formatCurrency(stats.totalVentas)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Ganancias Totales</p>
              <p className="stat-value text-blue-600">{formatCurrency(stats.totalGanancias)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Ganancia Promedio</p>
              <p className="stat-value text-purple-600">{formatNumber(stats.promedioGanancia)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Costeos */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Proyectos Costeados</h2>
        </div>
        <div className="card-body p-0">
          {costeos.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay proyectos costeados</p>
              <Link href="/costeo/nuevo" className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Crear Primer Costeo
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Horas Trabajadas</th>
                    <th>Costo Material</th>
                    <th>Costo Mano Obra</th>
                    <th>Costo Insumos</th>
                    <th>Costo Total</th>
                    <th>Precio Venta</th>
                    <th>Ganancia</th>
                    <th>% Ganancia</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {costeos.map((costeo) => (
                    <tr key={costeo.id} className="hover:bg-gray-50">
                      <td>
                        <Link 
                          href={`/costeo/${costeo.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {costeo.proyecto}
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatNumber(costeo.horas_trabajadas)} hrs</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(costeo.costo_material)}</div>
                          <div className="text-gray-500 text-xs">{formatNumber(costeo.porcentaje_material)}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(costeo.costo_mano_obra)}</div>
                          <div className="text-gray-500 text-xs">{formatNumber(costeo.porcentaje_mano_obra)}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(costeo.costo_insumos)}</div>
                          <div className="text-gray-500 text-xs">{formatNumber(costeo.porcentaje_insumos)}%</div>
                        </div>
                      </td>
                      <td className="font-semibold text-red-600">
                        {formatCurrency(costeo.costo_total)}
                      </td>
                      <td className="font-semibold text-green-600">
                        {formatCurrency(costeo.precio_venta)}
                      </td>
                      <td className="font-semibold text-blue-600">
                        {formatCurrency(costeo.ganancia_total)}
                      </td>
                      <td>
                        <span className={`badge ${
                          costeo.porcentaje_ganancia >= 40 ? 'badge-success' :
                          costeo.porcentaje_ganancia >= 20 ? 'badge-info' :
                          costeo.porcentaje_ganancia >= 10 ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {formatNumber(costeo.porcentaje_ganancia)}%
                        </span>
                      </td>
                      <td className="text-gray-500 text-sm">
                        {new Date(costeo.created_at).toLocaleDateString()}
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
