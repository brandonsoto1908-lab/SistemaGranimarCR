'use client'

import { useEffect, useState } from 'react'
import { supabase, uploadImage, deleteImage, getImageUrl } from '@/lib/supabase'
import { formatCurrency, debounce } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface Disco {
  id: string
  codigo: string
  tipo: string
  material_compatible: string | null
  diametro: number | null
  espesor: number | null
  marca: string | null
  costo: number
  vida_util_estimada: number | null
  imagenes: string[] | null
  ubicacion: string | null
  notas: string | null
  created_at: string
}

export default function DiscosPage() {
  const [discos, setDiscos] = useState<Disco[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterMaterial, setFilterMaterial] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingDisco, setEditingDisco] = useState<Disco | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'disco_corte',
    material_compatible: '',
    diametro: 0,
    espesor: 0,
    marca: '',
    costo: 0,
    vida_util_estimada: 0,
    ubicacion: '',
    notas: '',
    imagenes: [] as string[],
  })

  useEffect(() => {
    fetchDiscos()
  }, [filterTipo, filterMaterial])

  const fetchDiscos = async () => {
    try {
      setLoading(true)
      let query = supabase.from('discos').select('*').order('created_at', { ascending: false })

      if (filterTipo) {
        query = query.eq('tipo', filterTipo)
      }
      if (filterMaterial) {
        query = query.eq('material_compatible', filterMaterial)
      }

      const { data, error } = await query

      if (error) throw error
      setDiscos(data || [])
    } catch (error) {
      console.error('Error fetching discos:', error)
      toast.error('Error al cargar herramientas')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = debounce((term: string) => {
    setSearchTerm(term)
  }, 300)

  const filteredDiscos = discos.filter(disco =>
    disco.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disco.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disco.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadedPaths: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `disco_${Date.now()}_${i}_${file.name}`
        const path = await uploadImage(file, 'discos-images', fileName)
        uploadedPaths.push(path)
      }

      setFormData(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, ...uploadedPaths]
      }))

      toast.success(`${uploadedPaths.length} imagen(es) subida(s)`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error al subir imágenes')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = async (path: string) => {
    try {
      await deleteImage(path)
      setFormData(prev => ({
        ...prev,
        imagenes: prev.imagenes.filter(img => img !== path)
      }))
      toast.success('Imagen eliminada')
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Error al eliminar imagen')
    }
  }

  const openModal = (disco?: Disco) => {
    if (disco) {
      setEditingDisco(disco)
      setFormData({
        codigo: disco.codigo,
        tipo: disco.tipo,
        material_compatible: disco.material_compatible || '',
        diametro: disco.diametro || 0,
        espesor: disco.espesor || 0,
        marca: disco.marca || '',
        costo: disco.costo,
        vida_util_estimada: disco.vida_util_estimada || 0,
        ubicacion: disco.ubicacion || '',
        notas: disco.notas || '',
        imagenes: disco.imagenes || [],
      })
    } else {
      setEditingDisco(null)
      setFormData({
        codigo: '',
        tipo: 'disco_corte',
        material_compatible: '',
        diametro: 0,
        espesor: 0,
        marca: '',
        costo: 0,
        vida_util_estimada: 0,
        ubicacion: '',
        notas: '',
        imagenes: [],
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDisco(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const discoData = {
        codigo: formData.codigo,
        tipo: formData.tipo,
        material_compatible: formData.material_compatible || null,
        diametro: formData.diametro || null,
        espesor: formData.espesor || null,
        marca: formData.marca || null,
        costo: formData.costo,
        vida_util_estimada: formData.vida_util_estimada || null,
        imagenes: formData.imagenes.length > 0 ? formData.imagenes : null,
        ubicacion: formData.ubicacion || null,
        notas: formData.notas || null,
      }

      if (editingDisco) {
        const { error } = await supabase
          .from('discos')
          .update(discoData)
          .eq('id', editingDisco.id)

        if (error) throw error
        toast.success('Herramienta actualizada')
      } else {
        const { error } = await supabase
          .from('discos')
          .insert([discoData])

        if (error) throw error
        toast.success('Herramienta creada')
      }

      closeModal()
      fetchDiscos()
    } catch (error: any) {
      console.error('Error saving disco:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (disco: Disco) => {
    if (!confirm(`¿Eliminar herramienta ${disco.codigo}?`)) return

    try {
      // Delete images from storage
      if (disco.imagenes && disco.imagenes.length > 0) {
        for (const path of disco.imagenes) {
          await deleteImage(path)
        }
      }

      const { error } = await supabase
        .from('discos')
        .delete()
        .eq('id', disco.id)

      if (error) throw error
      toast.success('Herramienta eliminada')
      fetchDiscos()
    } catch (error: any) {
      console.error('Error deleting disco:', error)
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Herramientas y Discos</h1>
          <p className="page-subtitle">Gestión de herramientas de corte con galería de imágenes</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nueva Herramienta
        </button>
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
                placeholder="Código, marca, tipo..."
                onChange={(e) => handleSearch(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">
                <Filter className="w-4 h-4" />
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="disco_corte">Disco de Corte</option>
                <option value="disco_desbaste">Disco de Desbaste</option>
                <option value="disco_pulido">Disco de Pulido</option>
                <option value="broca">Broca</option>
                <option value="sierra">Sierra</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="label">Material Compatible</label>
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="granito">Granito</option>
                <option value="cuarzo">Cuarzo</option>
                <option value="marmol">Mármol</option>
                <option value="porcelanato">Porcelanato</option>
                <option value="universal">Universal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : filteredDiscos.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay herramientas registradas</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiscos.map((disco) => (
            <div key={disco.id} className="card hover:shadow-lg transition-shadow">
              {/* Image Gallery */}
              {disco.imagenes && disco.imagenes.length > 0 ? (
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={getImageUrl(disco.imagenes[0])}
                    alt={disco.codigo}
                    className="w-full h-full object-cover"
                  />
                  {disco.imagenes.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                      +{disco.imagenes.length - 1} fotos
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{disco.codigo}</h3>
                  <span className="badge badge-primary text-xs">{disco.tipo.replace('_', ' ')}</span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  {disco.marca && <p><strong>Marca:</strong> {disco.marca}</p>}
                  {disco.material_compatible && (
                    <p><strong>Material:</strong> {disco.material_compatible}</p>
                  )}
                  {disco.diametro && (
                    <p><strong>Diámetro:</strong> {disco.diametro}mm</p>
                  )}
                  <p className="text-lg font-semibold text-primary-600 mt-2">
                    {formatCurrency(disco.costo)}
                  </p>
                  {disco.vida_util_estimada && (
                    <p className="text-xs text-gray-500">
                      Vida útil: ~{disco.vida_util_estimada} horas
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openModal(disco)}
                    className="btn btn-sm btn-secondary flex-1"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(disco)}
                    className="btn btn-sm btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDisco ? 'Editar Herramienta' : 'Nueva Herramienta'}
              </h3>
              <button onClick={closeModal} className="btn btn-sm btn-ghost btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="label">Imágenes</label>
                  <div className="space-y-4">
                    {/* Upload Button */}
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <label
                        htmlFor="image-upload"
                        className="btn btn-secondary cursor-pointer"
                      >
                        {uploadingImages ? (
                          <>
                            <div className="spinner spinner-sm"></div>
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Subir Imágenes
                          </>
                        )}
                      </label>
                      <span className="text-sm text-gray-600">
                        {formData.imagenes.length} imagen(es)
                      </span>
                    </div>

                    {/* Image Preview Grid */}
                    {formData.imagenes.length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {formData.imagenes.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={getImageUrl(url)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label label-required">Código</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label label-required">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="disco_corte">Disco de Corte</option>
                      <option value="disco_desbaste">Disco de Desbaste</option>
                      <option value="disco_pulido">Disco de Pulido</option>
                      <option value="broca">Broca</option>
                      <option value="sierra">Sierra</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Material Compatible</label>
                    <select
                      value={formData.material_compatible}
                      onChange={(e) => setFormData({ ...formData, material_compatible: e.target.value })}
                      className="input"
                    >
                      <option value="">Sin especificar</option>
                      <option value="granito">Granito</option>
                      <option value="cuarzo">Cuarzo</option>
                      <option value="marmol">Mármol</option>
                      <option value="porcelanato">Porcelanato</option>
                      <option value="universal">Universal</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Marca</label>
                    <input
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="input"
                      placeholder="Marca del fabricante"
                    />
                  </div>

                  <div>
                    <label className="label">Diámetro (mm)</label>
                    <input
                      type="number"
                      value={formData.diametro}
                      onChange={(e) => setFormData({ ...formData, diametro: parseFloat(e.target.value) || 0 })}
                      className="input"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="label">Espesor (mm)</label>
                    <input
                      type="number"
                      value={formData.espesor}
                      onChange={(e) => setFormData({ ...formData, espesor: parseFloat(e.target.value) || 0 })}
                      className="input"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="label label-required">Costo (₡)</label>
                    <input
                      type="number"
                      value={formData.costo}
                      onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
                      className="input"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Vida Útil (horas)</label>
                    <input
                      type="number"
                      value={formData.vida_util_estimada}
                      onChange={(e) => setFormData({ ...formData, vida_util_estimada: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Ubicación</label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="input"
                    placeholder="Ubicación física en el almacén"
                  />
                </div>

                <div>
                  <label className="label">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
