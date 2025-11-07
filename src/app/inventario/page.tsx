'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber, getStockLevel } from '@/lib/utils'
import { Package, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Material {
  id: string
  nombre: string
  categoria: string | null
  unidad_medida: string | null
  cantidad_actual: number
  cantidad_minima: number | null
  precio_unitario: number | null
  ubicacion_fisica: string | null
  created_at: string
}

export default function InventarioPage() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [filteredMateriales, setFilteredMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('')
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    fetchMateriales()
  }, [])

  useEffect(() => {
    filterMateriales()
  }, [searchTerm, filterCategoria, materiales])

  const fetchMateriales = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (error) throw error

      setMateriales(data || [])
      
      // Extraer categorías únicas
      const cats = Array.from(new Set(data?.map(m => m.categoria).filter(Boolean) as string[]))
      setCategorias(cats)
    } catch (error: any) {
      console.error('Error fetching materiales:', error)
      toast.error('Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }

  const filterMateriales = () => {
    let filtered = materiales

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.categoria?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterCategoria) {
      filtered = filtered.filter(m => m.categoria === filterCategoria)
    }

    setFilteredMateriales(filtered)
  }

  const getStockBadge = (material: Material) => {
    const level = getStockLevel(material.cantidad_actual, material.cantidad_minima)
    const badges = {
      high: 'badge-success',
      medium: 'badge-info',
      low: 'badge-warning',
      critical: 'badge-danger',
    }
    return badges[level]
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventario de Materiales</h1>
          <p className="page-subtitle">Gestión de materiales y stock</p>
        </div>
        <Link href="/inventario/nuevo" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo Material
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Categoría</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="input pl-10"
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategoria('')
                }}
                className="btn btn-ghost w-full"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cards-4">
        <div className="stat-card">
          <p className="stat-label">Total Materiales</p>
          <p className="stat-value">{materiales.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Stock Bajo</p>
          <p className="stat-value text-amber-600">
            {materiales.filter(m => 
              m.cantidad_minima && m.cantidad_actual < m.cantidad_minima
            ).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Valor Total</p>
          <p className="stat-value">
            {formatCurrency(
              materiales.reduce((sum, m) => 
                sum + (m.cantidad_actual * (m.precio_unitario || 0)), 0
              )
            )}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Categorías</p>
          <p className="stat-value">{categorias.length}</p>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Precio Unit.</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMateriales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                filteredMateriales.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">
                          {material.nombre}
                        </div>
                        {material.ubicacion_fisica && (
                          <div className="text-xs text-gray-500">
                            📍 {material.ubicacion_fisica}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {material.categoria && (
                        <span className="badge badge-primary">
                          {material.categoria}
                        </span>
                      )}
                    </td>
                    <td>
                      {formatNumber(material.cantidad_actual, 2)}{' '}
                      {material.unidad_medida}
                    </td>
                    <td>
                      {material.cantidad_minima 
                        ? `${formatNumber(material.cantidad_minima, 2)} ${material.unidad_medida}`
                        : '-'
                      }
                    </td>
                    <td>{formatCurrency(material.precio_unitario || 0)}</td>
                    <td>
                      {formatCurrency(
                        material.cantidad_actual * (material.precio_unitario || 0)
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStockBadge(material)}`}>
                        {material.cantidad_minima && material.cantidad_actual < material.cantidad_minima
                          ? 'Stock Bajo'
                          : 'Normal'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/inventario/${material.id}`}
                          className="btn btn-sm btn-ghost"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/inventario/${material.id}/entrada`}
                          className="btn btn-sm btn-success"
                        >
                          Entrada
                        </Link>
                        <Link
                          href={`/inventario/${material.id}/salida`}
                          className="btn btn-sm btn-warning"
                        >
                          Salida
                        </Link>
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
