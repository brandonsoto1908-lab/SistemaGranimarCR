// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, Plus, Search, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Gasto {
  id: string
  concepto: string
  categoria: string | null
  monto: number
  moneda: string
  es_fijo: boolean
  fecha: string
  mes: number
  anio: number
  notas: string | null
  created_at: string
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterMes, setFilterMes] = useState<number>(new Date().getMonth() + 1)
  const [filterAnio, setFilterAnio] = useState<number>(new Date().getFullYear())
  const [tipoCambio, setTipoCambio] = useState<number>(0)

  useEffect(() => {
    fetchGastos()
    fetchTipoCambio()
  }, [filterMes, filterAnio])

  useEffect(() => {
    filterGastos()
  }, [searchTerm, filterTipo, gastos])

  const handleDelete = async (id: string, concepto: string) => {
    if (!confirm(`¿Está seguro de eliminar el gasto "${concepto}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Gasto eliminado exitosamente')
      fetchGastos()
    } catch (error: any) {
      console.error('Error deleting gasto:', error)
      toast.error('Error al eliminar gasto: ' + error.message)
    }
  }

  const fetchTipoCambio = async () => {
    try {
      const response = await fetch('https://api.hacienda.go.cr/indicadores/tc/dolar')
      const data = await response.json()
      
      if (data && data.length > 0) {
        // Tomar el valor de venta del dólar del último registro
        const ultimoRegistro = data[data.length - 1]
        setTipoCambio(parseFloat(ultimoRegistro.venta.valor))
      }
    } catch (error) {
      console.error('Error fetching tipo cambio:', error)
      // Usar tipo de cambio por defecto si falla
      setTipoCambio(520)
    }
  }

  const fetchGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('mes', filterMes)
        .eq('anio', filterAnio)
        .order('fecha', { ascending: false })

      if (error) throw error

      setGastos(data || [])
    } catch (error: any) {
      console.error('Error fetching gastos:', error)
      toast.error('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }

  const filterGastos = () => {
    let filtered = gastos

    if (searchTerm) {
      filtered = filtered.filter(g =>
        g.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.categoria?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterTipo === 'fijos') {
      filtered = filtered.filter(g => g.es_fijo === true)
    } else if (filterTipo === 'variables') {
      filtered = filtered.filter(g => g.es_fijo === false)
    }

    setFilteredGastos(filtered)
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  // Calculate stats
  const totalGastos = filteredGastos.reduce((sum, g) => sum + g.monto, 0)
  const gastosFijos = filteredGastos.filter(g => g.es_fijo).reduce((sum, g) => sum + g.monto, 0)
  const gastosVariables = filteredGastos.filter(g => !g.es_fijo).reduce((sum, g) => sum + g.monto, 0)

  // Calcular totales en ambas monedas
  const totalCRC = filteredGastos.reduce((sum, g) => {
    if (g.moneda === 'CRC') return sum + g.monto
    if (tipoCambio > 0) return sum + (g.monto * tipoCambio) // Convertir USD a CRC
    return sum
  }, 0)

  const totalUSD = filteredGastos.reduce((sum, g) => {
    if (g.moneda === 'USD') return sum + g.monto
    if (tipoCambio > 0) return sum + (g.monto / tipoCambio) // Convertir CRC a USD
    return sum
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">Gestión de gastos operativos y préstamos</p>
        </div>
        <div className="flex gap-3">
          <Link href="/gastos/prestamos" className="btn btn-secondary">
            <DollarSign className="w-5 h-5" />
            Préstamos
          </Link>
          <Link href="/gastos/nuevo" className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Nuevo Gasto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar gastos..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="fijos">Fijos</option>
                <option value="variables">Variables</option>
              </select>
            </div>
            <div>
              <label className="label">Mes</label>
              <select
                className="input"
                value={filterMes}
                onChange={(e) => setFilterMes(Number(e.target.value))}
              >
                {meses.map((mes, idx) => (
                  <option key={idx} value={idx + 1}>{mes}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Año</label>
              <select
                className="input"
                value={filterAnio}
                onChange={(e) => setFilterAnio(Number(e.target.value))}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cards">
        <div className="stat-card">
          <p className="stat-label">Total Gastos</p>
          <p className="stat-value">{formatCurrency(totalGastos)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Gastos Fijos</p>
          <p className="stat-value text-red-600">{formatCurrency(gastosFijos)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Gastos Variables</p>
          <p className="stat-value text-blue-600">{formatCurrency(gastosVariables)}</p>
        </div>
      </div>

      {/* Gastos Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Moneda</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGastos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron gastos para este período
                  </td>
                </tr>
              ) : (
                filteredGastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>
                      {new Date(gasto.fecha).toLocaleDateString('es-CR')}
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {gasto.concepto}
                      </div>
                      {gasto.notas && (
                        <div className="text-xs text-gray-500 mt-1">
                          {gasto.notas}
                        </div>
                      )}
                    </td>
                    <td>
                      {gasto.categoria && (
                        <span className="badge badge-secondary">
                          {gasto.categoria}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${gasto.es_fijo ? 'badge-danger' : 'badge-info'}`}>
                        {gasto.es_fijo ? 'Fijo' : 'Variable'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {gasto.moneda === 'USD' ? '$ USD' : '₡ CRC'}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {gasto.moneda === 'USD' 
                          ? `$${gasto.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `₡${gasto.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/gastos/editar/${gasto.id}`}
                          className="btn btn-sm btn-ghost text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(gasto.id, gasto.concepto)}
                          className="btn btn-sm btn-ghost text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="text-right">Total del Período:</td>
                <td>
                  <div className="space-y-1">
                    <div className="text-teal-700">
                      ₡{totalCRC.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-blue-700 text-sm">
                      ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {tipoCambio > 0 && (
                      <div className="text-xs text-gray-500">
                        TC: ₡{tipoCambio.toFixed(2)}
                      </div>
                    )}
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
