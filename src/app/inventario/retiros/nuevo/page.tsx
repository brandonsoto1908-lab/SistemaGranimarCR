// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatNumber, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, AlertCircle, Scissors, DollarSign } from 'lucide-react'
import Link from 'next/link'

const LAMINA_ML = 3.22

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_costo: number
  precio_venta: number
  precio_lineal: number
}

interface Sobrante {
  id: string
  material_id: string
  metros_lineales: number
  proyecto_origen: string | null
  usado: boolean
  created_at: string
}

export default function NuevoRetiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [sobrantes, setSobrantes] = useState<Sobrante[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    material_id: '',
    tipo_retiro: 'laminas_completas' as 'laminas_completas' | 'metros_lineales',
    cantidad_laminas: 1,
    metros_lineales: 0,
    proyecto: '',
    cliente: '',
    usuario: '',
    descripcion: '',
    uso_sobrantes: false,
    fecha_retiro: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchMateriales()
  }, [])

  useEffect(() => {
    if (formData.material_id) {
      const material = materiales.find(m => m.id === formData.material_id)
      setSelectedMaterial(material || null)
      if (material && formData.tipo_retiro === 'metros_lineales') {
        fetchSobrantes(material.id)
      }
    }
  }, [formData.material_id, formData.tipo_retiro, materiales])

  const fetchMateriales = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('id, nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal')
        .order('nombre')

      if (error) throw error
      setMateriales(data || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
      toast.error('Error al cargar materiales')
    }
  }

  const fetchSobrantes = async (materialId: string) => {
    try {
      const { data, error } = await supabase
        .from('sobros')
        .select('*')
        .eq('material_id', materialId)
        .eq('usado', false)
        .order('metros_lineales', { ascending: false })

      if (error) throw error
      setSobrantes(data || [])
    } catch (error) {
      console.error('Error fetching sobrantes:', error)
      setSobrantes([])
    }
  }

  const calcularTotales = () => {
    if (!selectedMaterial) return { costo: 0, venta: 0, ganancia: 0, laminasNecesarias: 0, sobranteGenerado: 0 }

    let costo = 0
    let venta = 0
    let laminasNecesarias = 0
    let sobranteGenerado = 0

    if (formData.tipo_retiro === 'laminas_completas') {
      laminasNecesarias = formData.cantidad_laminas
      costo = formData.cantidad_laminas * selectedMaterial.precio_costo
      venta = formData.cantidad_laminas * selectedMaterial.precio_venta
    } else {
      const metrosNecesarios = formData.metros_lineales
      
      if (formData.uso_sobrantes && sobrantes.length > 0) {
        const metrosSobrantes = sobrantes.reduce((sum, s) => sum + s.metros_lineales, 0)
        const metrosUsadosSobrantes = Math.min(metrosNecesarios, metrosSobrantes)
        const metrosRestantes = metrosNecesarios - metrosUsadosSobrantes
        
        if (metrosRestantes > 0) {
          laminasNecesarias = Math.ceil(metrosRestantes / LAMINA_ML)
          const metrosLaminasUsadas = laminasNecesarias * LAMINA_ML
          sobranteGenerado = metrosLaminasUsadas - metrosRestantes
        }
        
        costo = laminasNecesarias * selectedMaterial.precio_costo
      } else {
        laminasNecesarias = Math.ceil(metrosNecesarios / LAMINA_ML)
        const metrosLaminasUsadas = laminasNecesarias * LAMINA_ML
        sobranteGenerado = metrosLaminasUsadas - metrosNecesarios
        costo = laminasNecesarias * selectedMaterial.precio_costo
      }
      
      venta = metrosNecesarios * selectedMaterial.precio_lineal
    }

    const ganancia = venta - costo
    return { costo, venta, ganancia, laminasNecesarias, sobranteGenerado }
  }

  const totales = calcularTotales()
  const sobrantesDisponibles = sobrantes.reduce((sum, s) => sum + s.metros_lineales, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMaterial) {
      toast.error('Selecciona un material')
      return
    }

    if (formData.tipo_retiro === 'laminas_completas' && formData.cantidad_laminas <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (formData.tipo_retiro === 'metros_lineales' && formData.metros_lineales <= 0) {
      toast.error('Los metros lineales deben ser mayores a 0')
      return
    }

    if (!formData.proyecto.trim()) {
      toast.error('El proyecto es obligatorio')
      return
    }

    if (!formData.usuario.trim()) {
      toast.error('El usuario es obligatorio')
      return
    }

    const laminasDisponibles = selectedMaterial.cantidad_laminas
    if (totales.laminasNecesarias > laminasDisponibles) {
      toast.error(`Stock insuficiente. Disponible: ${laminasDisponibles} láminas, necesitas: ${totales.laminasNecesarias}`)
      return
    }

    setLoading(true)

    try {
      const { data: retiroData, error: retiroError } = await supabase
        .from('retiros')
        .insert([{
          material_id: formData.material_id,
          tipo_retiro: formData.tipo_retiro,
          cantidad_laminas: formData.tipo_retiro === 'laminas_completas' ? formData.cantidad_laminas : 0,
          metros_lineales: formData.tipo_retiro === 'metros_lineales' ? formData.metros_lineales : 0,
          proyecto: formData.proyecto,
          cliente: formData.cliente || null,
          usuario: formData.usuario,
          descripcion: formData.descripcion || null,
          costo_total: totales.costo,
          precio_venta_total: totales.venta,
          ganancia: totales.ganancia,
          uso_sobrantes: formData.uso_sobrantes,
          fecha_retiro: new Date(formData.fecha_retiro).toISOString(),
        }])
        .select()
        .single()

      if (retiroError) throw retiroError

      if (formData.uso_sobrantes && formData.tipo_retiro === 'metros_lineales' && sobrantes.length > 0) {
        let metrosRestantes = formData.metros_lineales
        
        for (const sobrante of sobrantes) {
          if (metrosRestantes <= 0) break
          
          if (sobrante.metros_lineales <= metrosRestantes) {
            await supabase
              .from('sobros')
              .update({ 
                usado: true, 
                fecha_uso: new Date().toISOString(),
                notas: `Usado en retiro: ${formData.proyecto}`
              })
              .eq('id', sobrante.id)
            
            metrosRestantes -= sobrante.metros_lineales
          } else {
            const metrosUsados = metrosRestantes
            const metrosRestantesSobrante = sobrante.metros_lineales - metrosUsados
            
            await supabase
              .from('sobros')
              .update({ 
                usado: true, 
                fecha_uso: new Date().toISOString(),
                notas: `Usado parcialmente (${metrosUsados.toFixed(2)}ml) en: ${formData.proyecto}`
              })
              .eq('id', sobrante.id)
            
            await supabase
              .from('sobros')
              .insert([{
                material_id: formData.material_id,
                metros_lineales: metrosRestantesSobrante,
                proyecto_origen: sobrante.proyecto_origen,
                usado: false,
                notas: 'Remanente de sobrante original'
              }])
            
            metrosRestantes = 0
          }
        }
      }

      if (formData.tipo_retiro === 'metros_lineales' && totales.sobranteGenerado > 0.01) {
        await supabase
          .from('sobros')
          .insert([{
            material_id: formData.material_id,
            metros_lineales: totales.sobranteGenerado,
            retiro_origen_id: retiroData.id,
            proyecto_origen: formData.proyecto,
            usado: false,
          }])
      }

      const nuevaCantidad = selectedMaterial.cantidad_laminas - totales.laminasNecesarias
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ cantidad_laminas: nuevaCantidad })
        .eq('id', formData.material_id)

      if (updateError) throw updateError

      toast.success('Retiro registrado exitosamente')
      router.push('/inventario/retiros')
    } catch (error: any) {
      console.error('Error creating retiro:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventario/retiros" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Retiro</h1>
          <p className="page-subtitle">Registrar salida de material del inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Material */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Material
            </h2>

            <div>
              <label className="label">Material *</label>
              <select
                value={formData.material_id}
                onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Seleccionar material...</option>
                {materiales.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.nombre} - Stock: {material.cantidad_laminas} lám. ({formatNumber(material.cantidad_laminas * LAMINA_ML)} ml)
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterial && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Información del Material</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Stock disponible:</span>
                    <span className="ml-2 font-medium">{selectedMaterial.cantidad_laminas} láminas</span>
                    <span className="ml-1 text-blue-600">({formatNumber(selectedMaterial.cantidad_laminas * LAMINA_ML)} ml)</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Precio lámina:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedMaterial.precio_venta)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Costo lámina:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedMaterial.precio_costo)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Precio lineal:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedMaterial.precio_lineal)}/ml</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipo de Retiro */}
        {selectedMaterial && (
          <div className="card">
            <div className="card-body space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Tipo de Retiro
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_retiro: 'laminas_completas', uso_sobrantes: false })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.tipo_retiro === 'laminas_completas'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Láminas Completas</div>
                  <div className="text-sm text-gray-600">Para proyectos que requieren láminas enteras</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_retiro: 'metros_lineales' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.tipo_retiro === 'metros_lineales'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Metros Lineales</div>
                  <div className="text-sm text-gray-600">Para sobremesas y cortes específicos</div>
                </button>
              </div>

              {formData.tipo_retiro === 'laminas_completas' ? (
                <div>
                  <label className="label">Cantidad de Láminas *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.cantidad_laminas}
                    onChange={(e) => setFormData({ ...formData, cantidad_laminas: parseInt(e.target.value) || 0 })}
                    className="input"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    = {formatNumber(formData.cantidad_laminas * LAMINA_ML)} metros lineales
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Metros Lineales *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.metros_lineales}
                      onChange={(e) => setFormData({ ...formData, metros_lineales: parseFloat(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Se necesitarán {totales.laminasNecesarias} lámina(s) completa(s)
                    </p>
                  </div>

                  {sobrantes.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-green-900">Sobrantes Disponibles</h4>
                          <p className="text-sm text-green-600">
                            {sobrantes.length} pieza(s) - Total: {formatNumber(sobrantesDisponibles)} ml
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.uso_sobrantes}
                            onChange={(e) => setFormData({ ...formData, uso_sobrantes: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-green-900">Usar sobrantes</span>
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        {sobrantes.slice(0, 5).map((sobrante) => (
                          <div key={sobrante.id} className="flex justify-between text-sm bg-white rounded px-3 py-2">
                            <span className="text-gray-700">
                              {formatNumber(sobrante.metros_lineales)} ml
                              {sobrante.proyecto_origen && (
                                <span className="text-gray-500 ml-2">- {sobrante.proyecto_origen}</span>
                              )}
                            </span>
                            <span className="text-gray-500">
                              {new Date(sobrante.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ))}
                        {sobrantes.length > 5 && (
                          <p className="text-xs text-green-600 text-center">
                            + {sobrantes.length - 5} sobrante(s) más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {totales.sobranteGenerado > 0.01 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Sobrante Generado</h4>
                      <p className="text-sm text-yellow-700">
                        Se generará un sobrante de <span className="font-bold">{formatNumber(totales.sobranteGenerado)} ml</span>
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Este sobrante quedará disponible para futuros retiros
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información del Proyecto */}
        {selectedMaterial && (
          <div className="card">
            <div className="card-body space-y-4">
              <h2 className="text-lg font-semibold">Información del Proyecto</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Proyecto *</label>
                  <input
                    type="text"
                    value={formData.proyecto}
                    onChange={(e) => setFormData({ ...formData, proyecto: e.target.value })}
                    className="input"
                    placeholder="Ej: Cocina Casa Escazú"
                    required
                  />
                </div>

                <div>
                  <label className="label">Cliente</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className="input"
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div>
                  <label className="label">Usuario Responsable *</label>
                  <input
                    type="text"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className="input"
                    placeholder="Nombre del usuario"
                    required
                  />
                </div>

                <div>
                  <label className="label">Fecha de Retiro *</label>
                  <input
                    type="date"
                    value={formData.fecha_retiro}
                    onChange={(e) => setFormData({ ...formData, fecha_retiro: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción / Notas</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Información adicional sobre el retiro..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Resumen Financiero */}
        {selectedMaterial && (formData.tipo_retiro === 'laminas_completas' ? formData.cantidad_laminas > 0 : formData.metros_lineales > 0) && (
          <div className="card">
            <div className="card-body space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen Financiero
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Láminas Necesarias</div>
                  <div className="text-2xl font-bold text-gray-900">{totales.laminasNecesarias}</div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 mb-1">Costo Total</div>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(totales.costo)}</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Precio Venta</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(totales.venta)}</div>
                </div>

                <div className={`rounded-lg p-4 ${totales.ganancia >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-sm mb-1 ${totales.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Ganancia
                  </div>
                  <div className={`text-2xl font-bold ${totales.ganancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(totales.ganancia)}
                  </div>
                </div>
              </div>

              {formData.uso_sobrantes && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✓ Usando sobrantes disponibles - Se reducirá el consumo de láminas nuevas
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/inventario/retiros" className="btn btn-secondary flex-1">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || !selectedMaterial}
            className="btn btn-primary flex-1"
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
      </form>
    </div>
  )
}
