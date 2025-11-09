// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function NuevoMaterialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad_laminas: 0,
    precio_costo: 0,
    precio_venta: 0,
    precio_lineal: 0,
    precio_por_metro: 0,
  })

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

  const uploadImage = async (materialId: string): Promise<string | null> => {
    if (!selectedFile) return null

    setUploadingImage(true)
    try {
      // Generar nombre único para la imagen
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${materialId}-${Date.now()}.${fileExt}`

      // Subir imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('materiales')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
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

  const removeImagePreview = () => {
    setSelectedFile(null)
    setImagePreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      // Crear el material primero
      const { data: material, error: materialError } = await supabase
        .from('materiales')
        .insert([{
          nombre: formData.nombre.trim(),
          cantidad_laminas: formData.cantidad_laminas,
          precio_costo: formData.precio_costo,
          precio_venta: formData.precio_venta,
          precio_lineal: formData.precio_lineal,
          precio_por_metro: formData.precio_por_metro,
        }])
        .select()
        .single()

      if (materialError) throw materialError

      // Subir imagen si existe
      if (selectedFile && material) {
        const imageUrl = await uploadImage(material.id)
        
        if (imageUrl) {
          // Actualizar el material con la URL de la imagen
          const { error: updateError } = await supabase
            .from('materiales')
            .update({ imagen_url: imageUrl })
            .eq('id', material.id)

          if (updateError) {
            console.error('Error updating image URL:', updateError)
            toast.error('Material creado pero error al guardar la imagen')
          }
        }
      }

      toast.success('Material creado exitosamente')
      router.push('/inventario')
    } catch (error: any) {
      console.error('Error creating material:', error)
      toast.error('Error al crear material: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nombre' ? value : parseFloat(value) || 0,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario" className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Material</h1>
          <p className="page-subtitle">Agregar material al inventario</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información y Precios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
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
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ej: Granito Negro Galaxy"
                    required
                  />
                </div>

                <div>
                  <label className="label">Stock Inicial (Láminas)</label>
                  <input
                    type="number"
                    name="cantidad_laminas"
                    value={formData.cantidad_laminas}
                    onChange={handleChange}
                    className="input"
                    min="0"
                    step="1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Cantidad de láminas en stock
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
                      value={formData.precio_costo}
                      onChange={handleChange}
                      className="input"
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
                      value={formData.precio_venta}
                      onChange={handleChange}
                      className="input"
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
                      value={formData.precio_lineal}
                      onChange={handleChange}
                      className="input"
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
                      value={formData.precio_por_metro}
                      onChange={handleChange}
                      className="input"
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
                {imagePreview ? (
                  <div className="space-y-2">
                    <label className="label">Vista Previa</label>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImagePreview}
                        className="absolute top-2 right-2 btn btn-sm btn-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedFile?.name}
                    </p>
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
            disabled={loading || uploadingImage}
            className="btn btn-primary"
          >
            {loading || uploadingImage ? (
              <>
                <div className="spinner"></div>
                {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Material
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
