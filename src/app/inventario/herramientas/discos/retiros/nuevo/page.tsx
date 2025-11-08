// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, AlertCircle, Search } from 'lucide-react'
import Link from 'next/link'

interface Disco {
  id: string
  nombre: string
  tipo: string
  marca: string | null
  cantidad: number
  material_compatible: string | null
}

export default function NuevoRetiroDiscoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [discos, setDiscos] = useState<Disco[]>([])
  const [filteredDiscos, setFilteredDiscos] = useState<Disco[]>([])
  const [searchDisco, setSearchDisco] = useState('')
  const [selectedDisco, setSelectedDisco] = useState<Disco | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [formData, setFormData] = useState({
    disco_id: '',
    cantidad: '',
    motivo: '',
    usuario: '',
    fecha_retiro: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchDiscos()
  }, [])

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Filtrar discos en tiempo real con búsqueda inteligente
    if (searchDisco.trim() === '') {
      setFilteredDiscos(discos)
    } else {
      const searchTerms = searchDisco.toLowerCase().trim().split(/\s+/)
      
      const filtered = discos.filter(disco => {
        const searchableText = [
          disco.nombre,
          disco.tipo,
          disco.marca || '',
          disco.material_compatible || ''
        ].join(' ').toLowerCase()

        // Buscar todas las palabras ingresadas
        return searchTerms.every(term => searchableText.includes(term))
      })

      // Ordenar por relevancia
      const sorted = filtered.sort((a, b) => {
        const aText = `${a.nombre} ${a.tipo} ${a.material_compatible || ''}`.toLowerCase()
        const bText = `${b.nombre} ${b.tipo} ${b.material_compatible || ''}`.toLowerCase()
        const searchLower = searchDisco.toLowerCase()

        // Priorizar coincidencias exactas al inicio
        const aStartsWith = aText.startsWith(searchLower) ? 1 : 0
        const bStartsWith = bText.startsWith(searchLower) ? 1 : 0
        
        if (aStartsWith !== bStartsWith) {
          return bStartsWith - aStartsWith
        }

        // Priorizar por nombre > tipo > material
        const aNameMatch = a.nombre.toLowerCase().includes(searchLower) ? 3 : 0
        const bNameMatch = b.nombre.toLowerCase().includes(searchLower) ? 3 : 0
        const aTipoMatch = a.tipo.toLowerCase().includes(searchLower) ? 2 : 0
        const bTipoMatch = b.tipo.toLowerCase().includes(searchLower) ? 2 : 0
        const aMaterialMatch = (a.material_compatible || '').toLowerCase().includes(searchLower) ? 1 : 0
        const bMaterialMatch = (b.material_compatible || '').toLowerCase().includes(searchLower) ? 1 : 0

        const aScore = aNameMatch + aTipoMatch + aMaterialMatch
        const bScore = bNameMatch + bTipoMatch + bMaterialMatch

        return bScore - aScore
      })

      setFilteredDiscos(sorted)
    }
  }, [searchDisco, discos])

  const fetchDiscos = async () => {
    try {
      const { data, error } = await supabase
        .from('discos')
        .select('*')
        .order('nombre')

      if (error) throw error
      setDiscos(data || [])
      setFilteredDiscos(data || [])
    } catch (error) {
      console.error('Error fetching discos:', error)
      toast.error('Error al cargar discos')
    }
  }

  const handleSelectDisco = (disco: Disco) => {
    setSelectedDisco(disco)
    setSearchDisco(disco.nombre)
    setFormData({ ...formData, disco_id: disco.id })
    setShowDropdown(false)
  }

  const handleSearchChange = (value: string) => {
    setSearchDisco(value)
    setShowDropdown(true)
    if (value.trim() === '') {
      setSelectedDisco(null)
      setFormData({ ...formData, disco_id: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDisco) {
      toast.error('Selecciona un disco o herramienta')
      return
    }

    const cantidad = parseInt(formData.cantidad)
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (cantidad > selectedDisco.cantidad) {
      toast.error(`No hay suficiente stock. Disponible: ${formatNumber(selectedDisco.cantidad)} unidades`)
      return
    }

    try {
      setLoading(true)

      // Crear el movimiento de salida
      const { error: movimientoError } = await supabase
        .from('discos_movimientos')
        .insert([{
          disco_id: formData.disco_id,
          tipo_movimiento: 'salida',
          cantidad: cantidad,
          motivo: formData.motivo || null,
          usuario: formData.usuario || null,
          fecha_retiro: new Date(formData.fecha_retiro).toISOString(),
        }])

      if (movimientoError) throw movimientoError

      // Actualizar el stock del disco
      const { error: updateError } = await supabase
        .from('discos')
        .update({
          cantidad: selectedDisco.cantidad - cantidad
        })
        .eq('id', formData.disco_id)

      if (updateError) throw updateError

      toast.success('Retiro registrado exitosamente')
      router.push('/inventario/herramientas/discos/retiros')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario/herramientas/discos/retiros" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Registrar Retiro de Discos/Herramientas</h1>
          <p className="page-subtitle">Registra la salida de discos o herramientas del inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Retiro */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Información del Retiro</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="label label-required">Disco/Herramienta</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchDisco}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    className="input pr-10"
                    placeholder="Buscar disco o herramienta..."
                    required
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Dropdown de resultados */}
                {showDropdown && filteredDiscos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredDiscos.map(disco => (
                      <button
                        key={disco.id}
                        type="button"
                        onClick={() => handleSelectDisco(disco)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{disco.nombre}</div>
                        <div className="flex items-center gap-2 mt-1 text-sm flex-wrap">
                          <span className="badge badge-secondary badge-sm">{disco.tipo}</span>
                          {disco.marca && <span className="text-gray-600">{disco.marca}</span>}
                          {disco.material_compatible && (
                            <span className="badge badge-info badge-sm">{disco.material_compatible}</span>
                          )}
                          <span className="text-teal-600 font-medium ml-auto">
                            {formatNumber(disco.cantidad)} disponibles
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Información del disco seleccionado */}
                {selectedDisco && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tipo:</span> {selectedDisco.tipo}
                    </p>
                    {selectedDisco.marca && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Marca:</span> {selectedDisco.marca}
                      </p>
                    )}
                    {selectedDisco.material_compatible && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Material:</span> {selectedDisco.material_compatible}
                      </p>
                    )}
                  </div>
                )}

                {/* Mensaje si no hay resultados */}
                {showDropdown && searchDisco && filteredDiscos.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No se encontraron discos o herramientas
                  </div>
                )}
              </div>

              <div>
                <label className="label label-required">Cantidad de Unidades</label>
                <input
                  type="number"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="input"
                  placeholder="0"
                  required
                  min="1"
                />
                {selectedDisco && (
                  <p className="text-sm text-gray-600 mt-1">
                    Disponible: {formatNumber(selectedDisco.cantidad)} unidades
                  </p>
                )}
              </div>
            </div>

            {selectedDisco && parseInt(formData.cantidad) > selectedDisco.cantidad && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <strong>Stock insuficiente:</strong> Solo hay {formatNumber(selectedDisco.cantidad)} unidades disponibles.
                </div>
              </div>
            )}

            <div>
              <label className="label label-required">Detalle del Retiro</label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="textarea"
                rows={3}
                placeholder="Describe el detalle o motivo del retiro"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label label-required">Fecha del Retiro</label>
                <input
                  type="date"
                  value={formData.fecha_retiro}
                  onChange={(e) => setFormData({ ...formData, fecha_retiro: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label label-required">Persona que Retira</label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="input"
                  placeholder="Nombre de la persona"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {selectedDisco && formData.cantidad && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Resumen del Retiro</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Disco/Herramienta</p>
                  <p className="font-medium text-gray-900">{selectedDisco.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedDisco.tipo}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cantidad a Retirar</p>
                  <p className="font-medium text-gray-900">{formatNumber(parseInt(formData.cantidad))} unidades</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stock Restante</p>
                  <p className="font-medium text-gray-900">
                    {formatNumber(selectedDisco.cantidad - parseInt(formData.cantidad))} unidades
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <div className="card-footer">
            <div className="flex gap-4 justify-end">
              <Link href="/inventario/herramientas/discos/retiros" className="btn btn-ghost">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || (selectedDisco && parseInt(formData.cantidad) > selectedDisco.cantidad)}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Registrar Retiro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
