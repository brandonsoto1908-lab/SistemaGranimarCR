'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMonthYear, generateCode } from '@/lib/utils'
import { Wrench, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Produccion {
  id: string
  codigo_sobre: string
  cliente: string
  tipo_material: string | null
  metros_lineales: number
  fecha_produccion: string
  costo_total: number
  estado: string
  created_at: string
}

export default function ProduccionPage() {
  const [producciones, setProducciones] = useState<Produccion[]>([])
  const [filteredProduccion, setFilteredProduccion] = useState<Produccion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  useEffect(() => {
    fetchProducciones()
  }, [])

  useEffect(() => {
    filterProduccion()
  }, [searchTerm, filterEstado, producciones])

  const fetchProducciones = async () => {
    try {
      const { data, error } = await supabase
        .from('produccion')
        .select('*')
        .order('fecha_produccion', { ascending: false })

      if (error) throw error

      setProducciones(data || [])
    } catch (error: any) {
      console.error('Error fetching produccion:', error)
      toast.error('Error al cargar producción')
    } finally {
      setLoading(false)
    }
  }

  const filterProduccion = () => {
    let filtered = producciones

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.codigo_sobre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterEstado) {
      filtered = filtered.filter(p => p.estado === filterEstado)
    }

    setFilteredProduccion(filtered)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      en_proceso: 'badge-warning',
      completado: 'badge-success',
      entregado: 'badge-info',
      cancelado: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      en_proceso: 'En Proceso',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  // Calculate stats
  const totalMetros = producciones.reduce((sum, p) => sum + p.metros_lineales, 0)
  const totalCosto = producciones.reduce((sum, p) => sum + p.costo_total, 0)
  const enProceso = producciones.filter(p => p.estado === 'en_proceso').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Producción</h1>
          <p className="page-subtitle">Gestión de órdenes de producción</p>
        </div>
        <Link href="/produccion/nuevo" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nueva Orden
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o cliente..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cards-4">
        <div className="stat-card">
          <p className="stat-label">Total Órdenes</p>
          <p className="stat-value">{producciones.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">En Proceso</p>
          <p className="stat-value text-amber-600">{enProceso}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Metros Totales</p>
          <p className="stat-value">{totalMetros.toFixed(2)} m</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Costo Total</p>
          <p className="stat-value">{formatCurrency(totalCosto)}</p>
        </div>
      </div>

      {/* Production Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Material</th>
                <th>Metros</th>
                <th>Fecha</th>
                <th>Costo Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProduccion.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron órdenes de producción
                  </td>
                </tr>
              ) : (
                filteredProduccion.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <span className="font-mono font-medium text-gray-900">
                        {prod.codigo_sobre}
                      </span>
                    </td>
                    <td>{prod.cliente}</td>
                    <td>
                      {prod.tipo_material && (
                        <span className="badge badge-primary">
                          {prod.tipo_material}
                        </span>
                      )}
                    </td>
                    <td>{prod.metros_lineales.toFixed(2)} m</td>
                    <td>
                      {new Date(prod.fecha_produccion).toLocaleDateString('es-CR')}
                    </td>
                    <td>{formatCurrency(prod.costo_total)}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(prod.estado)}`}>
                        {getEstadoLabel(prod.estado)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/produccion/${prod.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        Ver Detalles
                      </Link>
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
