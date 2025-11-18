// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber, getMonthYear } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, Trash2, Package, Calendar, User } from 'lucide-react'
import Link from 'next/link'

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_costo: number
  precio_venta: number
}

interface Retiro {
  id: string
  material_id: string
  tipo_retiro: 'laminas_completas' | 'metros_lineales'
  cantidad_laminas: number
  metros_lineales: number
  proyecto: string
  cliente: string | null
  usuario: string
  descripcion: string | null
  costo_total: number
  precio_venta_total: number
  ganancia: number
  uso_sobrantes: boolean
  fecha_retiro: string
  created_at: string
  materiales?: Material
}

export default function RetirosPage() {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMes, setFilterMes] = useState<string>('')
  const [filterAnio, setFilterAnio] = useState<string>(new Date().getFullYear().toString())

  useEffect(() => {
    fetchRetiros()
  }, [filterMes, filterAnio])

  const fetchRetiros = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('retiros')
        .select(`
          *,
          materiales (
            id,
            nombre,
            cantidad_laminas,
            precio_costo,
            precio_venta
          )
        `)
        .order('fecha_retiro', { ascending: false })

      // Filtrar por mes y año si están seleccionados
      if (filterAnio) {
        const startDate = filterMes 
          ? new Date(parseInt(filterAnio), parseInt(filterMes) - 1, 1).toISOString()
          : new Date(parseInt(filterAnio), 0, 1).toISOString()
        
        const endDate = filterMes
          ? new Date(parseInt(filterAnio), parseInt(filterMes), 0, 23, 59, 59).toISOString()
          : new Date(parseInt(filterAnio), 11, 31, 23, 59, 59).toISOString()

        query = query.gte('fecha_retiro', startDate).lte('fecha_retiro', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      setRetiros(data || [])
    } catch (error) {
      console.error('Error fetching retiros:', error)
      toast.error('Error al cargar retiros')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (retiro: Retiro) => {
    if (!confirm(`¿Eliminar retiro de ${retiro.materiales?.nombre}?\n\nEsto revertirá:\n- Las láminas al inventario\n- Los sobrantes utilizados\n- Los sobrantes generados`)) return

    try {
      // PASO 1: Obtener información del material actual
      const { data: materialData, error: materialError } = await supabase
        .from('materiales')
        .select('cantidad_laminas')
        .eq('id', retiro.material_id)
        .single()

      if (materialError) throw materialError

      // PASO 2: Revertir las láminas al inventario
      const nuevaCantidad = materialData.cantidad_laminas + retiro.cantidad_laminas
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ cantidad_laminas: nuevaCantidad })
        .eq('id', retiro.material_id)

      if (updateError) throw updateError

      // PASO 3: Buscar sobrantes generados por este retiro y eliminarlos
      const { error: deleteSobrosGeneradosError } = await supabase
        .from('sobros')
        .delete()
        .eq('retiro_origen_id', retiro.id)

      if (deleteSobrosGeneradosError) throw deleteSobrosGeneradosError

      // PASO 4: Si el retiro usó sobrantes, buscarlos y revertirlos
      if (retiro.uso_sobrantes && retiro.tipo_retiro === 'metros_lineales') {
        // Buscar sobrantes marcados como usados que incluyan este proyecto en las notas
        const { data: sobrosUsados, error: sobrosUsadosError } = await supabase
          .from('sobros')
          .select('*')
          .eq('material_id', retiro.material_id)
          .eq('usado', true)
          .ilike('notas', `%${retiro.proyecto}%`)

        if (sobrosUsadosError) throw sobrosUsadosError

        // Revertir cada sobrante usado
        if (sobrosUsados && sobrosUsados.length > 0) {
          for (const sobro of sobrosUsados) {
            // Buscar si existe un sobrante unificado aprovechable para este material
            const { data: sobroUnificado, error: sobroUnificadoError } = await supabase
              .from('sobros')
              .select('*')
              .eq('material_id', retiro.material_id)
              .eq('usado', false)
              .eq('aprovechable', true)
              .eq('notas', 'Sobrantes generales unificados')
              .single()

            if (sobroUnificadoError && sobroUnificadoError.code !== 'PGRST116') {
              throw sobroUnificadoError
            }

            if (sobroUnificado) {
              // Si existe, sumar los metros del sobrante usado al unificado
              const nuevosMetros = sobroUnificado.metros_lineales + sobro.metros_lineales
              await supabase
                .from('sobros')
                .update({ metros_lineales: nuevosMetros })
                .eq('id', sobroUnificado.id)
            } else {
              // Si no existe, crear uno nuevo con los metros del sobrante usado
              await supabase
                .from('sobros')
                .insert([{
                  material_id: retiro.material_id,
                  metros_lineales: sobro.metros_lineales,
                  proyecto_origen: 'General',
                  notas: 'Sobrantes generales unificados',
                  usado: false,
                  aprovechable: true
                }])
            }

            // Eliminar el sobrante usado
            await supabase
              .from('sobros')
              .delete()
              .eq('id', sobro.id)
          }
        }
      }

      // PASO 5: Eliminar el retiro
      const { error: deleteRetiroError } = await supabase
        .from('retiros')
        .delete()
        .eq('id', retiro.id)

      if (deleteRetiroError) throw deleteRetiroError

      toast.success('Retiro eliminado y cantidades revertidas')
      fetchRetiros()
    } catch (error: any) {
      console.error('Error deleting retiro:', error)
      toast.error('Error: ' + error.message)
    }
  }

  const filteredRetiros = retiros.filter(retiro => {
    const searchLower = searchTerm.toLowerCase()
    return (
      retiro.materiales?.nombre?.toLowerCase().includes(searchLower) ||
      retiro.proyecto?.toLowerCase().includes(searchLower) ||
      retiro.descripcion?.toLowerCase().includes(searchLower) ||
      retiro.usuario?.toLowerCase().includes(searchLower)
    )
  })

  // Calcular totales
  const totalRetiros = filteredRetiros.reduce((sum, r) => {
    return sum + (r.tipo_retiro === 'laminas_completas' ? r.cantidad_laminas : Math.ceil(r.metros_lineales / 3.22))
  }, 0)
  const valorTotal = filteredRetiros.reduce((sum, r) => sum + r.precio_venta_total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Retiros de Inventario</h1>
          <p className="page-subtitle">Control de salidas de material</p>
        </div>
        <Link href="/inventario/retiros/nuevo" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Registrar Retiro
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Retiros</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRetiros.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cantidad Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalRetiros)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <Search className="w-4 h-4" />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Material, proyecto, motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">
                <Filter className="w-4 h-4" />
                Mes
              </label>
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="input"
              >
                <option value="">Todos los meses</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>

            <div>
              <label className="label">
                <Calendar className="w-4 h-4" />
                Año
              </label>
              <select
                value={filterAnio}
                onChange={(e) => setFilterAnio(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredRetiros.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay retiros registrados</h3>
            <p className="text-gray-500 mb-4">Comienza registrando tu primer retiro de inventario</p>
            <Link href="/inventario/retiros/nuevo" className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Registrar Retiro
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Material</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Proyecto</th>
                  <th>Usuario</th>
                  <th>Valor</th>
                  <th>Ganancia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRetiros.map((retiro) => (
                  <tr key={retiro.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(retiro.fecha_retiro).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {retiro.materiales?.nombre || 'Material eliminado'}
                      </div>
                      {retiro.descripcion && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {retiro.descripcion}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${retiro.tipo_retiro === 'laminas_completas' ? 'badge-info' : 'badge-warning'}`}>
                        {retiro.tipo_retiro === 'laminas_completas' ? 'Láminas' : 'Metros'}
                      </span>
                      {retiro.uso_sobrantes && (
                        <div className="text-xs text-green-600 mt-1">+ Sobrantes</div>
                      )}
                    </td>
                    <td>
                      {retiro.tipo_retiro === 'laminas_completas' ? (
                        <span className="font-medium text-gray-900">
                          {formatNumber(retiro.cantidad_laminas)} lám.
                        </span>
                      ) : (
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatNumber(retiro.metros_lineales)} ml
                          </div>
                          <div className="text-xs text-gray-500">
                            ({Math.ceil(retiro.metros_lineales / 3.22)} lám.)
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-gray-900 font-medium">
                        {retiro.proyecto}
                      </div>
                      {retiro.cliente && (
                        <div className="text-xs text-gray-500">{retiro.cliente}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        {retiro.usuario}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(retiro.precio_venta_total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Costo: {formatCurrency(retiro.costo_total)}
                      </div>
                    </td>
                    <td>
                      <div className={`font-medium ${retiro.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(retiro.ganancia)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(retiro)}
                        className="btn btn-sm btn-danger"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
