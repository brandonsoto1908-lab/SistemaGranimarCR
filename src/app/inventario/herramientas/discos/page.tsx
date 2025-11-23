// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase, uploadImage, deleteImage, getImageUrl } from '@/lib/supabase'
import { formatCurrency, debounce } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface Disco {
  id: string
  nombre: string
  tipo: string
  material_compatible: string | null
  marca: string | null
  imagenes: string[] | null
  cantidad?: number
  diametro?: number | null
  espesor?: number | null
  descripcion_detallada?: string | null
  ubicacion_fisica?: string | null
  notas?: string | null
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
  const [categorias, setCategorias] = useState<string[]>([
    'Piedra de devastar',
    'Disco de pulir',
    'Disco curvo',
    'Disco de corte',
    'Juego de discos',
    'Felpa',
    'Broca',
    'Broca especial',
    'Accesorio'
  ])
  const [showAgregarCategoria, setShowAgregarCategoria] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Disco de pulir',
    marca: '',
    material_compatible: '',
    cantidad: '',
    imagenes: [] as string[],
  })

  useEffect(() => {
    fetchDiscos()
    cargarCategoriasGuardadas()
  }, [filterTipo, filterMaterial])

  const cargarCategoriasGuardadas = () => {
    const categoriasGuardadas = localStorage.getItem('herramientas_categorias')
    if (categoriasGuardadas) {
      try {
        const categoriasParsed = JSON.parse(categoriasGuardadas)
        setCategorias(prev => {
          const todasCategorias = [...prev, ...categoriasParsed]
          return [...new Set(todasCategorias)] // Eliminar duplicados
        })
      } catch (error) {
        console.error('Error cargando categorías:', error)
      }
    }
  }

  const agregarNuevaCategoria = () => {
    if (!nuevaCategoria.trim()) {
      toast.error('Ingresa un nombre para la categoría')
      return
    }

    if (categorias.includes(nuevaCategoria.trim())) {
      toast.error('Esta categoría ya existe')
      return
    }

    const nuevasCategorias = [...categorias, nuevaCategoria.trim()]
    setCategorias(nuevasCategorias)
    
    // Guardar solo las categorías personalizadas
    const categoriasBase = [
      'Piedra de devastar',
      'Disco de pulir',
      'Disco curvo',
      'Disco de corte',
      'Juego de discos',
      'Felpa',
      'Broca',
      'Broca especial',
      'Accesorio'
    ]
    const categoriasPersonalizadas = nuevasCategorias.filter(c => !categoriasBase.includes(c))
    localStorage.setItem('herramientas_categorias', JSON.stringify(categoriasPersonalizadas))
    
    setFormData({ ...formData, tipo: nuevaCategoria.trim() })
    setNuevaCategoria('')
    setShowAgregarCategoria(false)
    toast.success('Categoría agregada correctamente')
  }

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
    disco.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        nombre: disco.nombre,
        tipo: disco.tipo,
        marca: disco.marca || '',
        material_compatible: disco.material_compatible || '',
        cantidad: disco.cantidad?.toString() || '0',
        imagenes: disco.imagenes || [],
      })
    } else {
      setEditingDisco(null)
      setFormData({
        nombre: '',
        tipo: 'Disco de pulir',
        marca: '',
        material_compatible: '',
        cantidad: '0',
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
        nombre: formData.nombre,
        tipo: formData.tipo,
        marca: formData.marca || null,
        material_compatible: formData.material_compatible || null,
        cantidad: parseInt(formData.cantidad) || 0,
        imagenes: formData.imagenes.length > 0 ? formData.imagenes : null,
        // Campos opcionales con valores por defecto
        diametro: null,
        espesor: null,
        descripcion_detallada: null,
        ubicacion_fisica: null,
        notas: null,
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
    if (!confirm(`¿Eliminar herramienta ${disco.nombre}?`)) return

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
                <option value="Accesorio">Accesorio</option>
                <option value="Broca">Broca</option>
                <option value="Broca especial">Broca especial</option>
                <option value="Disco curvo">Disco curvo</option>
                <option value="Disco de corte">Disco de corte</option>
                <option value="Disco de pulir">Disco de pulir</option>
                <option value="Felpa">Felpa</option>
                <option value="Juego de discos">Juego de discos</option>
                <option value="Piedra de devastar">Piedra de devastar</option>
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
                <option value="Granito">Granito</option>
                <option value="Cuarzo">Cuarzo</option>
                <option value="Granito, Mármol, Cuarzo">Granito, Mármol, Cuarzo</option>
                <option value="Universal">Universal</option>
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
                    alt={disco.nombre}
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
                  <h3 className="font-semibold text-lg">{disco.nombre}</h3>
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
                  {disco.cantidad !== undefined && (
                    <p><strong>Cantidad:</strong> {disco.cantidad}</p>
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
        <>
          <div className="modal-overlay" onClick={closeModal}></div>
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

                {/* Formulario Simplificado */}
                <div>
                  <label className="label label-required">Nombre del Disco/Herramienta</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input"
                    placeholder="Ej: Disco Diamante 115mm, Sierra Circular 200mm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label label-required">Tipo de Herramienta</label>
                    {!showAgregarCategoria ? (
                      <div className="flex gap-2">
                        <select
                          value={formData.tipo}
                          onChange={(e) => {
                            if (e.target.value === '__nueva__') {
                              setShowAgregarCategoria(true)
                            } else {
                              setFormData({ ...formData, tipo: e.target.value })
                            }
                          }}
                          className="input flex-1"
                          required
                        >
                          {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__nueva__">+ Agregar nueva categoría</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nuevaCategoria}
                            onChange={(e) => setNuevaCategoria(e.target.value)}
                            placeholder="Nombre de la nueva categoría"
                            className="input flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                agregarNuevaCategoria()
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={agregarNuevaCategoria}
                            className="btn btn-sm btn-success"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAgregarCategoria(false)
                              setNuevaCategoria('')
                            }}
                            className="btn btn-sm btn-secondary"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Presiona Enter o haz clic en + para agregar</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Marca</label>
                    <input
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="input"
                      placeholder="Ej: Generic, JXDry, ADT"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Material Compatible</label>
                    <select
                      value={formData.material_compatible}
                      onChange={(e) => setFormData({ ...formData, material_compatible: e.target.value })}
                      className="input"
                    >
                      <option value="">Seleccionar material</option>
                      <option value="Granito">Granito</option>
                      <option value="Cuarzo">Cuarzo</option>
                      <option value="Granito, Mármol, Cuarzo">Granito, Mármol, Cuarzo</option>
                      <option value="Universal">Universal (Todos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label label-required">Cantidad Inicial</label>
                    <input
                      type="number"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      className="input"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
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
        </>
      )}
    </div>
  )
}
