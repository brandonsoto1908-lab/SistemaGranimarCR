'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  inventarioTotal: number
  gastosmes: number
  produccionMes: number
  materialesBajoStock: number
}

interface MaterialBajoStock {
  id: string
  nombre: string
  cantidad_actual: number
  cantidad_minima: number
  categoria: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    inventarioTotal: 0,
    gastosmes: 0,
    produccionMes: 0,
    materialesBajoStock: 0,
  })
  const [materialesBajoStock, setMaterialesBajoStock] = useState<MaterialBajoStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Obtener materiales bajo stock
      const { data: materiales, error: materialesError } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (materialesError) throw materialesError

      // Filtrar materiales bajo stock
      const bajoStock = materiales?.filter(
        (m) => m.cantidad_minima && m.cantidad_actual < m.cantidad_minima
      ) || []

      setMaterialesBajoStock(bajoStock)

      // Calcular valor total del inventario
      const totalInventario = materiales?.reduce(
        (sum, m) => sum + (m.cantidad_actual * (m.precio_unitario || 0)),
        0
      ) || 0

      // Obtener gastos del mes actual
      const { data: gastos, error: gastosError } = await supabase
        .from('gastos')
        .select('monto')
        .eq('mes', currentMonth)
        .eq('anio', currentYear)

      if (gastosError) throw gastosError

      const totalGastos = gastos?.reduce((sum, g) => sum + g.monto, 0) || 0

      // Obtener producción del mes actual
      const { data: produccion, error: produccionError } = await supabase
        .from('produccion')
        .select('metros_lineales')
        .eq('mes', currentMonth)
        .eq('anio', currentYear)

      if (produccionError) throw produccionError

      const totalMetros = produccion?.reduce((sum, p) => sum + p.metros_lineales, 0) || 0

      setStats({
        inventarioTotal: totalInventario,
        gastosmes: totalGastos,
        produccionMes: totalMetros,
        materialesBajoStock: bajoStock.length,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Resumen general del sistema de gestión Granimar CR
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-cards-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Valor Inventario</p>
              <p className="stat-value">{formatCurrency(stats.inventarioTotal)}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Gastos del Mes</p>
              <p className="stat-value">{formatCurrency(stats.gastosmes)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Producción (m)</p>
              <p className="stat-value">{formatNumber(stats.produccionMes, 2)} m</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Stock Bajo</p>
              <p className="stat-value">{stats.materialesBajoStock}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Materiales Bajo Stock */}
      {materialesBajoStock.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Materiales con Stock Bajo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Materiales que requieren reposición
              </p>
            </div>
            <Link href="/inventario" className="btn btn-sm btn-primary">
              Ver Todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {materialesBajoStock.slice(0, 5).map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{material.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      Categoría: {material.categoria || 'Sin categoría'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-800">
                      Stock: {formatNumber(material.cantidad_actual, 2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Mínimo: {formatNumber(material.cantidad_minima || 0, 2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid-cards">
        <Link href="/inventario/nuevo" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nuevo Material</h3>
                <p className="text-sm text-gray-600">Agregar material al inventario</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/produccion/nuevo" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nueva Producción</h3>
                <p className="text-sm text-gray-600">Registrar orden de producción</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/gastos/nuevo" className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nuevo Gasto</h3>
                <p className="text-sm text-gray-600">Registrar gasto operativo</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
