// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Package, AlertTriangle, Edit2, Trash2 } from 'lucide-react'

interface Insumo {
  id: string
  nombre: string
  descripcion: string
  unidad_medida: string
  precio_unitario: number
  stock_actual: number
  stock_minimo: number
  categoria: string
  proveedor: string
  created_at: string
}

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: 'unidad',
    precio_unitario: 0,
    stock_actual: 0,
    stock_minimo: 0,
    categoria: '',
    proveedor: ''
  })

  useEffect(() => {
    fetchInsumos()
  }, [])

  const fetchInsumos = async () => {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('nombre')

      if (error) throw error
      setInsumos(data || [])
    } catch (error) {
      console.error('Error fetching insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingInsumo) {
        const { error } = await supabase
          .from('insumos')
          .update(formData)
          .eq('id', editingInsumo.id)

        if (error) throw error
        toast.success('Insumo actualizado')
      } else {
        const { error } = await supabase
          .from('insumos')
          .insert([formData])

        if (error) throw error
        toast.success('Insumo creado')
      }

      setShowModal(false)
      setEditingInsumo(null)
      resetForm()
      fetchInsumos()
    } catch (error: any) {
      console.error('Error saving insumo:', error)
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setFormData({
      nombre: insumo.nombre,
      descripcion: insumo.descripcion || '',
      unidad_medida: insumo.unidad_medida,
      precio_unitario: insumo.precio_unitario,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
      categoria: insumo.categoria || '',
      proveedor: insumo.proveedor || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return

    try {
      const { error } = await supabase
        .from('insumos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Insumo eliminado')
      fetchInsumos()
    } catch (error: any) {
      console.error('Error deleting insumo:', error)
      toast.error('Error: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      unidad_medida: 'unidad',
      precio_unitario: 0,
      stock_actual: 0,
      stock_minimo: 0,
      categoria: '',
      proveedor: ''
    })
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
          <h1 className="page-title">Gestión de Insumos</h1>
          <p className="page-subtitle">
            Catálogo de insumos utilizados en producción
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingInsumo(null)
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Nuevo Insumo
        </button>
      </div>

      {/* Lista de Insumos */}
      <div className="card">
        <div className="card-body p-0">
          {insumos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay insumos registrados</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Insumo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Unidad</th>
                    <th>Precio Unitario</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Proveedor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((insumo) => (
                    <tr key={insumo.id} className="hover:bg-gray-50">
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{insumo.nombre}</div>
                          {insumo.descripcion && (
                            <div className="text-sm text-gray-500">{insumo.descripcion}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{insumo.categoria || 'Sin categoría'}</span>
                      </td>
                      <td>{insumo.unidad_medida}</td>
                      <td className="font-semibold">{formatCurrency(insumo.precio_unitario)}</td>
                      <td>
                        <span className={`font-medium ${
                          insumo.stock_actual <= insumo.stock_minimo ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatNumber(insumo.stock_actual)}
                        </span>
                        {insumo.stock_actual <= insumo.stock_minimo && (
                          <AlertTriangle className="w-4 h-4 text-red-600 inline ml-1" />
                        )}
                      </td>
                      <td className="text-gray-600">{formatNumber(insumo.stock_minimo)}</td>
                      <td className="text-gray-600">{insumo.proveedor || '-'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(insumo)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(insumo.id)}
                            className="btn btn-sm btn-danger"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingInsumo(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Categoría</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="input"
                    placeholder="Ej: Adhesivos, Tornillos"
                  />
                </div>

                <div>
                  <label className="label">Unidad de Medida *</label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    className="input"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>

                <div>
                  <label className="label">Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_unitario}
                    onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || 0 })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Stock Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Proveedor</label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="input"
                    placeholder="Nombre del proveedor"
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Descripción del insumo"
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingInsumo ? 'Actualizar' : 'Crear'} Insumo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingInsumo(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
