// @ts-nocheck
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
import StockAlertBanner from '@/components/StockAlertBanner'

// Una lámina de 3.22m × 1.59m puede generar mínimo 2 cortes de 60cm de ancho
// = 6.44 metros lineales por lámina (aproximado)
const LAMINA_ML = 6.44 // Metros lineales por lámina (mínimo 2 cortes)

interface DashboardStats {
  inventarioTotal: number
  inventarioVenta: number
  inventarioVentaLineal: number
  valorSobrantes: number
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
    inventarioVenta: 0,
    inventarioVentaLineal: 0,
    valorSobrantes: 0,
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
      // Get start and end of current month
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Obtener todos los materiales
      const { data: materiales, error: materialesError } = await supabase
        .from('materiales')
        .select('id, nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro')
        .order('nombre')

      if (materialesError) throw materialesError

      // Filtrar materiales con stock bajo (cantidad_laminas = 0)
      const bajoStock = materiales?.filter((m) => m.cantidad_laminas === 0) || []

      setMaterialesBajoStock(bajoStock.map(m => ({
        id: m.id,
        nombre: m.nombre,
        cantidad_actual: m.cantidad_laminas,
        cantidad_minima: 0,
        categoria: 'Material'
      })))

      // Calcular valor total del inventario en COSTO (cantidad_laminas * precio_costo)
      const totalInventario = materiales?.reduce(
        (sum, m) => sum + ((m.cantidad_laminas || 0) * (m.precio_costo || 0)),
        0
      ) || 0

      // Calcular valor total del inventario en VENTA (cantidad_laminas * precio_venta)
      const totalInventarioVenta = materiales?.reduce(
        (sum, m) => sum + ((m.cantidad_laminas || 0) * (m.precio_venta || 0)),
        0
      ) || 0

      // Calcular valor total del inventario en VENTA LINEAL (metros_lineales * precio_lineal)
      const totalInventarioVentaLineal = materiales?.reduce(
        (sum, m) => {
          const metrosLineales = (m.cantidad_laminas || 0) * LAMINA_ML
          return sum + (metrosLineales * (m.precio_lineal || 0))
        },
        0
      ) || 0

      // Obtener sobrantes aprovechables
      const { data: sobros, error: sobrosError } = await supabase
        .from('sobros')
        .select('material_id, metros_lineales')
        .eq('usado', false)
        .eq('aprovechable', true)

      if (sobrosError) throw sobrosError

      // Calcular valor de sobrantes (m² * precio_por_metro)
      let totalSobrantes = 0
      if (sobros && sobros.length > 0) {
        for (const sobro of sobros) {
          const material = materiales?.find(m => m.id === sobro.material_id)
          if (material && material.precio_por_metro) {
            totalSobrantes += sobro.metros_lineales * material.precio_por_metro
          }
        }
      }

      // Obtener gastos del mes actual (using fecha field with date range)
      const { data: gastos, error: gastosError } = await supabase
        .from('gastos')
        .select('monto')
        .gte('fecha', firstDayOfMonth.toISOString())
        .lte('fecha', lastDayOfMonth.toISOString())

      if (gastosError) throw gastosError

      const totalGastos = gastos?.reduce((sum, g) => sum + (g.monto || 0), 0) || 0

      // Obtener producción del mes actual (from produccion_sobres table using fecha)
      const { data: produccion, error: produccionError } = await supabase
        .from('produccion_sobres')
        .select('material_usado')
        .gte('fecha', firstDayOfMonth.toISOString())
        .lte('fecha', lastDayOfMonth.toISOString())

      if (produccionError) throw produccionError

      const totalMetros = produccion?.reduce((sum, p) => sum + (p.material_usado || 0), 0) || 0

      setStats({
        inventarioTotal: totalInventario,
        inventarioVenta: totalInventarioVenta,
        inventarioVentaLineal: totalInventarioVentaLineal,
        valorSobrantes: totalSobrantes,
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

      {/* Stock Alerts Banner */}
      <StockAlertBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Valor Inventario en Costo */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Inversión en Inventario</p>
              <p className="stat-value">{formatCurrency(stats.inventarioTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">Valor en costo</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Valor Inventario en Venta - NUEVO */}
        <div className="stat-card border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-green-800">💰 Venta Láminas Completas</p>
              <p className="stat-value text-green-700">{formatCurrency(stats.inventarioVenta)}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">
                Si vendes láminas completas (sin cortar)
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <Package className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700 font-semibold">
              Ganancia: {formatCurrency(stats.inventarioVenta - stats.inventarioTotal)}
            </p>
          </div>
        </div>

        {/* Valor Inventario en Venta LINEAL - NUEVO */}
        <div className="stat-card border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-blue-800">📏 Venta Metros Lineales</p>
              <p className="stat-value text-blue-700">{formatCurrency(stats.inventarioVentaLineal)}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Si vendes cortado en metros lineales (aproximado)
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700 font-semibold">
              Ganancia: {formatCurrency(stats.inventarioVentaLineal - stats.inventarioTotal)}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Basado en 6.44 ml por lámina (2 cortes mín.)
            </p>
          </div>
        </div>

        {/* Valor Sobrantes - NUEVO */}
        <div className="stat-card border-2 border-teal-200 bg-teal-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-teal-800">Valor en Sobrantes</p>
              <p className="stat-value text-teal-700">{formatCurrency(stats.valorSobrantes)}</p>
              <p className="text-xs text-teal-600 mt-1">Material aprovechable</p>
            </div>
            <div className="p-3 bg-teal-200 rounded-lg">
              <Package className="w-6 h-6 text-teal-700" />
            </div>
          </div>
        </div>

        {/* Gastos del Mes */}
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

        {/* Producción */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Producción (m)</p>
              <p className="stat-value">{formatNumber(stats.produccionMes, 2)} m</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Stock Bajo */}
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
