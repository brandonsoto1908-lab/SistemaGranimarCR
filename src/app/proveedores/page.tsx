'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPhone, isValidEmail, isValidPhone } from '@/lib/utils'
import { Users, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface Proveedor {
  id: string
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  created_at: string
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
  })

  useEffect(() => {
    fetchProveedores()
  }, [])

  useEffect(() => {
    filterProveedores()
  }, [searchTerm, proveedores])

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre')

      if (error) throw error

      setProveedores(data || [])
    } catch (error: any) {
      console.error('Error fetching proveedores:', error)
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const filterProveedores = () => {
    let filtered = proveedores

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contacto?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredProveedores(filtered)
  }

  const handleOpenModal = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditingProveedor(proveedor)
      setFormData({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        notas: proveedor.notas || '',
      })
    } else {
      setEditingProveedor(null)
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProveedor(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('Email inválido')
      return
    }

    if (formData.telefono && !isValidPhone(formData.telefono)) {
      toast.error('Teléfono inválido (debe tener 8 dígitos)')
      return
    }

    try {
      if (editingProveedor) {
        const { error } = await supabase
          .from('proveedores')
          .update(formData)
          .eq('id', editingProveedor.id)

        if (error) throw error
        toast.success('Proveedor actualizado exitosamente')
      } else {
        const { error } = await supabase
          .from('proveedores')
          .insert([formData])

        if (error) throw error
        toast.success('Proveedor creado exitosamente')
      }

      handleCloseModal()
      fetchProveedores()
    } catch (error: any) {
      console.error('Error saving proveedor:', error)
      toast.error('Error al guardar proveedor: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return

    try {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Proveedor eliminado exitosamente')
      fetchProveedores()
    } catch (error: any) {
      console.error('Error deleting proveedor:', error)
      toast.error('Error al eliminar proveedor: ' + error.message)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, contacto o email..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Proveedores Grid */}
      <div className="grid-cards">
        {filteredProveedores.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron proveedores</p>
          </div>
        ) : (
          filteredProveedores.map((proveedor) => (
            <div key={proveedor.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {proveedor.nombre}
                    </h3>
                    {proveedor.contacto && (
                      <p className="text-sm text-gray-600 mt-1">
                        {proveedor.contacto}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {proveedor.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(proveedor.telefono)}</span>
                    </div>
                  )}
                  {proveedor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="break-all">{proveedor.email}</span>
                    </div>
                  )}
                  {proveedor.direccion && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{proveedor.direccion}</span>
                    </div>
                  )}
                </div>

                {proveedor.notas && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {proveedor.notas}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleOpenModal(proveedor)}
                    className="btn btn-sm btn-ghost flex-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(proveedor.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal}></div>
          <div className="modal">
            <div className="modal-container">
              <div className="modal-content max-w-2xl">
                <div className="modal-header">
                  <h2 className="modal-title">
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h2>
                  <button onClick={handleCloseModal} className="btn btn-ghost btn-sm">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label label-required">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="input"
                      placeholder="Nombre del proveedor"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Persona de Contacto</label>
                    <input
                      type="text"
                      value={formData.contacto}
                      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                      className="input"
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="input"
                        placeholder="8888-8888"
                        maxLength={9}
                      />
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="input"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div>
                    <label className="label">Notas</label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseModal} className="btn btn-ghost">
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
