// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Trash2, Upload, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export default function EditarMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasRetiros, setHasRetiros] = useState(false)
  const [hasSobros, setHasSobros] = useState(false)
  const [sobrosCount, setSobrosCount] = useState(0)
  const [confirmDeleteSobros, setConfirmDeleteSobros] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad_laminas: 0,
    precio_costo: 0,
    precio_venta: 0,
    precio_lineal: 0,
    precio_por_metro: 0,
    imagen_url: ''
  })

  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [oldImagePath, setOldImagePath] = useState<string | null>(null)

  useEffect(() => {
    if (materialId) {
      fetchMaterial()
    }
  }, [materialId])

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .eq('id', materialId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          nombre: data.nombre || '',
          cantidad_laminas: data.cantidad_laminas || 0,
          precio_costo: data.precio_costo || 0,
          precio_venta: data.precio_venta || 0,
          precio_lineal: data.precio_lineal || 0,
          precio_por_metro: data.precio_por_metro || 0,
          imagen_url: data.imagen_url || ''
        })
        setImagePreview(data.imagen_url || '')
        setOldImagePath(data.imagen_url || null)
      }
    } catch (error: any) {
      console.error('Error fetching material:', error)
      toast.error('Error al cargar el material')
      router.push('/inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    setSelectedFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return formData.imagen_url

    setUploadingImage(true)
    try {
      // Eliminar imagen anterior si existe
      if (oldImagePath) {
        const oldPath = oldImagePath.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('materiales')
            .remove([oldPath])
        }
      }

      // Generar nombre único para la imagen
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${materialId}-${Date.now()}.${fileExt}`

      // Subir imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('materiales')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('materiales')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Error al subir la imagen')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = async () => {
    try {
      // Eliminar imagen del storage si existe
      if (formData.imagen_url) {
        const imagePath = formData.imagen_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('materiales')
            .remove([imagePath])
        }
      }

      setFormData(prev => ({ ...prev, imagen_url: '' }))
      setImagePreview('')
      setSelectedFile(null)
      setOldImagePath(null)
    } catch (error: any) {
      console.error('Error removing image:', error)
      toast.error('Error al eliminar la imagen')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nombre' ? value : parseFloat(value) || 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre del material es requerido')
      return
    }

    setSaving(true)
    try {
      // Subir imagen si hay una nueva seleccionada
      let imageUrl = formData.imagen_url
      if (selectedFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          toast.error('Error al subir la imagen')
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('materiales')
        .update({
          nombre: formData.nombre.trim(),
          precio_costo: formData.precio_costo,
          precio_venta: formData.precio_venta,
          precio_lineal: formData.precio_lineal,
          precio_por_metro: formData.precio_por_metro,
          imagen_url: imageUrl || null
        })
        .eq('id', materialId)

      if (error) throw error

      toast.success('Material actualizado correctamente')
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error updating material:', error)
      toast.error('Error al actualizar el material')
    } finally {
      setSaving(false)
    }
  }

  const checkDependencies = async () => {
    try {
      // Verificar si hay retiros asociados
      const { data: retiros, error: retirosError } = await supabase
        .from('retiros')
        .select('id')
        .eq('material_id', materialId)
        .limit(1)

      if (retirosError) throw retirosError
      setHasRetiros(retiros && retiros.length > 0)

      // Verificar si hay sobros asociados
      const { data: sobros, error: sobrosError } = await supabase
        .from('sobros')
        .select('id')
        .eq('material_id', materialId)

      if (sobrosError) throw sobrosError
      setHasSobros(sobros && sobros.length > 0)
      setSobrosCount(sobros?.length || 0)
    } catch (error: any) {
      console.error('Error checking dependencies:', error)
    }
  }

  const handleDeleteClick = async () => {
    await checkDependencies()
    setShowDeleteConfirm(true)
    setConfirmDeleteSobros(false)
  }

  const handleDelete = async () => {
    // Validar que no tenga retiros (esto no se puede eliminar)
    if (hasRetiros) {
      toast.error('No se puede eliminar el material porque tiene retiros asociados')
      return
    }

    // Si tiene sobrantes, requerir confirmación adicional
    if (hasSobros && !confirmDeleteSobros) {
      toast.error('Debes confirmar que deseas eliminar los sobrantes asociados')
      return
    }

    setDeleting(true)
    try {
      // Eliminar sobrantes asociados si existen
      if (hasSobros) {
        const { error: sobrosError } = await supabase
          .from('sobros')
          .delete()
          .eq('material_id', materialId)

        if (sobrosError) throw sobrosError
      }

      // Eliminar imagen del storage si existe
      if (formData.imagen_url) {
        const imagePath = formData.imagen_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('materiales')
            .remove([imagePath])
        }
      }

      // Eliminar el material
      const { error } = await supabase
        .from('materiales')
        .delete()
        .eq('id', materialId)

      if (error) throw error

      toast.success('Material eliminado correctamente')
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error deleting material:', error)
      toast.error('Error al eliminar el material')
      setDeleting(false)
      setShowDeleteConfirm(false)
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
        <div className="flex items-center gap-4">
          <Link href="/inventario" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Editar Material</h1>
            <p className="page-subtitle">Modificar información del material</p>
          </div>
        </div>
        <button
          onClick={handleDeleteClick}
          className="btn btn-danger"
          disabled={deleting}
        >
          <Trash2 className="w-5 h-5" />
          Eliminar Material
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Básica */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Información General</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">
                    Nombre del Material <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className="input"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Stock Actual (Láminas)</label>
                  <input
                    type="number"
                    className="input bg-gray-100"
                    value={formData.cantidad_laminas}
                    disabled
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    El stock se modifica mediante entradas y salidas
                  </p>
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Precios</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Precio de Costo (por lámina)</label>
                    <input
                      type="number"
                      name="precio_costo"
                      className="input"
                      value={formData.precio_costo}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.precio_costo)}
                    </p>
                  </div>

                  <div>
                    <label className="label">Precio de Venta (por lámina)</label>
                    <input
                      type="number"
                      name="precio_venta"
                      className="input"
                      value={formData.precio_venta}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.precio_venta)}
                    </p>
                  </div>

                  <div>
                    <label className="label">Precio Lineal (por metro lineal)</label>
                    <input
                      type="number"
                      name="precio_lineal"
                      className="input"
                      value={formData.precio_lineal}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.precio_lineal)}
                    </p>
                  </div>

                  <div>
                    <label className="label">Precio por Metro (por m²)</label>
                    <input
                      type="number"
                      name="precio_por_metro"
                      className="input"
                      value={formData.precio_por_metro}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.precio_por_metro)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen de Referencia */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Imagen de Referencia</h2>
              </div>
              <div className="card-body space-y-4">
                {/* Preview de la imagen */}
                {imagePreview ? (
                  <div className="space-y-2">
                    <label className="label">Vista Previa</label>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImagePreview('')
                          toast.error('Error al cargar la imagen')
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 btn btn-sm btn-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-gray-600">
                        Nueva imagen: {selectedFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="label">Subir Imagen</label>
                    <div className="flex items-center justify-center aspect-square w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex items-center justify-center">
                        <div className="text-center p-6">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Haz clic para subir
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG o WEBP (máx. 5MB)
                          </p>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {!imagePreview && (
                  <div>
                    <label htmlFor="image-upload" className="btn btn-primary w-full cursor-pointer">
                      <Upload className="w-5 h-5" />
                      Seleccionar Imagen
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Formatos: JPG, PNG, WEBP</p>
                  <p>• Tamaño máximo: 5MB</p>
                  <p>• Recomendado: imagen cuadrada</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/inventario" className="btn btn-ghost">
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  ¿Estás seguro de que deseas eliminar el material{' '}
                  <span className="font-semibold">{formData.nombre}</span>?
                </p>
              </div>

              {/* Advertencia de retiros */}
              {hasRetiros && (
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 text-sm">
                        No se puede eliminar
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        Este material tiene retiros asociados. No es posible eliminarlo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advertencia de sobrantes */}
              {hasSobros && !hasRetiros && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 text-sm">
                        Este material tiene {sobrosCount} sobrante{sobrosCount !== 1 ? 's' : ''} asociado{sobrosCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-amber-800 mt-1">
                        Al eliminar el material, también se eliminarán todos sus sobrantes.
                      </p>
                      
                      {/* Checkbox de confirmación */}
                      <label className="flex items-start gap-2 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmDeleteSobros}
                          onChange={(e) => setConfirmDeleteSobros(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-red-600 border-amber-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-amber-900">
                          Confirmo que deseo eliminar el material y todos sus sobrantes
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Info si no hay dependencias */}
              {!hasRetiros && !hasSobros && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Este material no tiene retiros ni sobrantes asociados. Puede eliminarse de forma segura.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmDeleteSobros(false)
                }}
                className="btn btn-ghost"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={deleting || hasRetiros || (hasSobros && !confirmDeleteSobros)}
              >
                {deleting ? (
                  <>
                    <div className="spinner"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Eliminar{hasSobros ? ' Todo' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
