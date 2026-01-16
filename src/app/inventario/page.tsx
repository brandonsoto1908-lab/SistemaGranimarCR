// @ts-nocheck
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
  cantidad_laminas: number
  precio_costo: number | null
  precio_venta: number | null
  precio_lineal: number | null
  precio_por_metro: number | null
  imagen_url: string | null
  created_at: string
  // Campos calculados de sobrantes
  sobros_metros?: number
}

interface Sobro {
  id: string
  material_id: string
  metros_lineales: number
  usado: boolean
  created_at: string
}

export default function InventarioPage() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [filteredMateriales, setFilteredMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sobros, setSobros] = useState<Sobro[]>([])
  
  // Constantes de conversión
  const LAMINA_LARGO = 3.22 // metros
  // Usar ancho real de lámina: 1.59m → 3.22 * 1.59 ≈ 5.12 m² (mitad ≈ 2.56 m²)
  const LAMINA_ANCHO = 1.59 // metros
  const LAMINA_M2 = LAMINA_LARGO * LAMINA_ANCHO // ≈ 5.12 m²
  // Una lámina puede generar mínimo 2 cortes de 60cm de ancho (aproximado)
  const LAMINA_ML = 6.44 // metros lineales por lámina (mínimo 2 cortes)

  useEffect(() => {
    fetchMateriales()
  }, [])

  useEffect(() => {
    filterMateriales()
  }, [searchTerm, materiales])

  const fetchMateriales = async () => {
    try {
      // Obtener materiales
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (materialesError) throw materialesError

      // Obtener todos los sobrantes no usados y aprovechables
      const { data: sobrosData, error: sobrosError } = await supabase
        .from('sobros')
        .select('*')
        .eq('usado', false)
        .eq('aprovechable', true)

      if (sobrosError) throw sobrosError

      setSobros(sobrosData || [])

      // Calcular totales de sobrantes por material (solo aprovechables)
      const materialesConSobros = (materialesData || []).map(material => {
        const sobrosDelMaterial = (sobrosData || []).filter(s => s.material_id === material.id)
        const sobros_metros = sobrosDelMaterial.reduce((sum, s) => sum + parseFloat(s.metros_lineales || 0), 0)

        return {
          ...material,
          sobros_metros: sobros_metros
        }
      })

      setMateriales(materialesConSobros)
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
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredMateriales(filtered)
  }

  const getStockBadge = (material: Material) => {
    // Stock mínimo fijo de 2 láminas
    const stockMinimo = 2
    if (material.cantidad_laminas === 0) return 'badge-danger'
    if (material.cantidad_laminas < stockMinimo) return 'badge-warning'
    if (material.cantidad_laminas < stockMinimo * 2) return 'badge-info'
    return 'badge-success'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn-ghost w-full"
              >
                Limpiar Búsqueda
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
            {materiales.filter(m => m.cantidad_laminas < 2).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Valor Total (Costo)</p>
          <p className="stat-value">
            {formatCurrency(
              materiales.reduce((sum, m) => 
                sum + (m.cantidad_laminas * (m.precio_costo || 0)), 0
              )
            )}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Láminas</p>
          <p className="stat-value">
            {materiales.reduce((sum, m) => sum + m.cantidad_laminas, 0)}
          </p>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Stock (Láminas)</th>
                <th>Sobrantes</th>
                <th>Precio Costo</th>
                <th>Precio Venta</th>
                <th>Precio Lineal</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMateriales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                filteredMateriales.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {material.imagen_url ? (
                          <img
                            src={material.imagen_url}
                            alt={material.nombre}
                            className="w-10 h-10 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="font-medium text-gray-900">
                          {material.nombre}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold">
                        {material.cantidad_laminas} láminas
                      </span>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>≈ {(material.cantidad_laminas * LAMINA_ML).toFixed(2)} ml</div>
                        <div className="font-medium text-blue-600">
                          {(material.cantidad_laminas * LAMINA_M2).toFixed(2)} m²
                        </div>
                      </div>
                    </td>
                    <td>
                      {material.sobros_metros && material.sobros_metros > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-teal-600">
                            {(material.sobros_metros).toFixed(2)} m²
                          </span>
                          {material.precio_por_metro && (
                            <span className="text-xs text-blue-600 font-medium">
                              {formatCurrency(material.sobros_metros * material.precio_por_metro)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin sobrantes</span>
                      )}
                    </td>
                    <td>{formatCurrency(material.precio_costo || 0)}</td>
                    <td>{formatCurrency(material.precio_venta || 0)}</td>
                    <td>{formatCurrency(material.precio_lineal || 0)}</td>
                    <td>
                      {formatCurrency(
                        material.cantidad_laminas * (material.precio_costo || 0)
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStockBadge(material)}`}>
                        {material.cantidad_laminas === 0 
                          ? 'Sin Stock'
                          : material.cantidad_laminas < 2
                          ? 'Stock Bajo'
                          : 'Normal'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/inventario/${material.id}/editar`}
                          className="btn btn-sm btn-ghost"
                        >
                          Editar
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
