// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatNumber, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Package, AlertCircle, Scissors, DollarSign, Calculator, ArrowDownCircle } from 'lucide-react'
import Link from 'next/link'

// Una lámina de 3.22m × 1.59m puede generar mínimo 2 cortes de 60cm de ancho
// = 6.44 metros lineales por lámina (aproximado)
const LAMINA_ML = 6.44 // Metros lineales por lámina (mínimo 2 cortes)
const LAMINA_M2 = 5.12 // Metros cuadrados por lámina (3.22m × 1.59m aproximadamente)

interface Material {
  id: string
  nombre: string
  cantidad_laminas: number
  precio_costo: number
  precio_venta: number
  precio_lineal: number
  precio_por_metro: number
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
    tipo_retiro: 'laminas_completas' as 'laminas_completas' | 'metros_lineales' | 'metros_cuadrados',
    cantidad_laminas: 1,
    metros_lineales: 0,
    metros_cuadrados: 0,
    largo_metros: 0,
    ancho_metros: 0,
    proyecto: '',
    cliente: '',
    usuario: '',
    descripcion: '',
    uso_sobrantes: false,
    fecha_retiro: new Date().toISOString().split('T')[0],
  })
  const [precioCobrado, setPrecioCobrado] = useState<number | null>(null)

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
        .eq('aprovechable', true)
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
    } else if (formData.tipo_retiro === 'metros_cuadrados') {
      // Opción nueva: Ingreso directo de m²
      const metrosCuadradosNecesarios = formData.metros_cuadrados
      
      if (formData.uso_sobrantes && sobrantes.length > 0) {
        const metrosSobrantes = sobrantes.reduce((sum, s) => sum + s.metros_lineales, 0)
        const metrosUsadosSobrantes = Math.min(metrosCuadradosNecesarios, metrosSobrantes)
        const metrosRestantes = metrosCuadradosNecesarios - metrosUsadosSobrantes
        
        if (metrosRestantes > 0) {
          laminasNecesarias = Math.ceil(metrosRestantes / LAMINA_M2)
          const metrosLaminasUsadas = laminasNecesarias * LAMINA_M2
          sobranteGenerado = metrosLaminasUsadas - metrosRestantes
        }
        
        costo = laminasNecesarias * selectedMaterial.precio_costo
      } else {
        laminasNecesarias = Math.ceil(metrosCuadradosNecesarios / LAMINA_M2)
        const metrosLaminasUsadas = laminasNecesarias * LAMINA_M2
        sobranteGenerado = metrosLaminasUsadas - metrosCuadradosNecesarios
        costo = laminasNecesarias * selectedMaterial.precio_costo
      }
      
      // Para m² directos, se cobra por el área usando precio_por_metro
      venta = metrosCuadradosNecesarios * (selectedMaterial.precio_por_metro || selectedMaterial.precio_venta / LAMINA_M2)
    } else {
      const metrosCuadradosNecesarios = formData.metros_lineales // metros cuadrados (área)
      // Metros lineales = Largo + Ancho (perímetro del frente y los lados)
      const metrosLinealesVenta = formData.largo_metros + formData.ancho_metros
      
      if (formData.uso_sobrantes && sobrantes.length > 0) {
        const metrosSobrantes = sobrantes.reduce((sum, s) => sum + s.metros_lineales, 0)
        const metrosUsadosSobrantes = Math.min(metrosCuadradosNecesarios, metrosSobrantes)
        const metrosRestantes = metrosCuadradosNecesarios - metrosUsadosSobrantes
        
        if (metrosRestantes > 0) {
          // Calcular láminas necesarias basado en m²
          laminasNecesarias = Math.ceil(metrosRestantes / LAMINA_M2)
          const metrosLaminasUsadas = laminasNecesarias * LAMINA_M2
          sobranteGenerado = metrosLaminasUsadas - metrosRestantes
        }
        
        costo = laminasNecesarias * selectedMaterial.precio_costo
      } else {
        // Calcular láminas necesarias basado en m²
        laminasNecesarias = Math.ceil(metrosCuadradosNecesarios / LAMINA_M2)
        const metrosLaminasUsadas = laminasNecesarias * LAMINA_M2
        sobranteGenerado = metrosLaminasUsadas - metrosCuadradosNecesarios
        costo = laminasNecesarias * selectedMaterial.precio_costo
      }
      
      // IMPORTANTE: La venta se calcula por metros LINEALES (largo + ancho), NO por m²
      venta = metrosLinealesVenta * selectedMaterial.precio_lineal
    }

    const ganancia = venta - costo
    return { costo, venta, ganancia, laminasNecesarias, sobranteGenerado }
  }

  const totales = calcularTotales()
  const sobrantesDisponibles = sobrantes.reduce((sum, s) => sum + s.metros_lineales, 0)

  useEffect(() => {
    if (precioCobrado === null) {
      setPrecioCobrado(totales.venta || 0)
    }
  }, [totales.venta])

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

    if (formData.tipo_retiro === 'metros_cuadrados' && formData.metros_cuadrados <= 0) {
      toast.error('Los metros cuadrados deben ser mayores a 0')
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
          metros_lineales: formData.tipo_retiro === 'metros_lineales' ? formData.metros_lineales : (formData.tipo_retiro === 'metros_cuadrados' ? formData.metros_cuadrados : 0),
          largo_metros: formData.tipo_retiro === 'metros_lineales' ? formData.largo_metros : 0,
          ancho_metros: formData.tipo_retiro === 'metros_lineales' ? formData.ancho_metros : 0,
          proyecto: formData.proyecto,
          cliente: formData.cliente || null,
          usuario: formData.usuario,
          descripcion: formData.descripcion || null,
          costo_total: totales.costo,
          precio_venta_total: totales.venta,
          precio_cobrado_total: precioCobrado ?? totales.venta,
          ganancia: totales.ganancia,
          uso_sobrantes: formData.uso_sobrantes,
          fecha_retiro: new Date(formData.fecha_retiro).toISOString(),
        }])
        .select()
        .single()

      if (retiroError) throw retiroError

      if (formData.uso_sobrantes && (formData.tipo_retiro === 'metros_lineales' || formData.tipo_retiro === 'metros_cuadrados') && sobrantes.length > 0) {
        let metrosRestantes = formData.tipo_retiro === 'metros_lineales' ? formData.metros_lineales : formData.metros_cuadrados
        
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
                notas: `Usado parcialmente (${metrosUsados.toFixed(2)}m²) en: ${formData.proyecto}`
              })
              .eq('id', sobrante.id)
            
            await supabase
              .from('sobros')
              .insert([{
                material_id: formData.material_id,
                metros_lineales: metrosRestantesSobrante,
                proyecto_origen: sobrante.proyecto_origen,
                usado: false,
                aprovechable: true,
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
            aprovechable: true,
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
      // Mostrar info completa del error para diagnóstico
      console.error('Error creating retiro:', error)
      const errText = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
      toast.error('Error al crear retiro: ' + errText)
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
                    {material.nombre} - Stock: {material.cantidad_laminas} lám. (≈{formatNumber(material.cantidad_laminas * LAMINA_ML)} ml)
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
                    <div className="ml-1 text-blue-600 text-xs">
                      (≈{formatNumber(selectedMaterial.cantidad_laminas * LAMINA_ML)} ml | {formatNumber(selectedMaterial.cantidad_laminas * LAMINA_M2)} m²)
                    </div>
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

              <div className="mt-4">
                <label className="label">Precio Cobrado (total)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioCobrado ?? 0}
                    onChange={(e) => setPrecioCobrado(parseFloat(e.target.value) || 0)}
                    className="input"
                  />
                  <div className="col-span-2 text-sm text-gray-600">
                    Ingresa el monto total que se cobrará por este retiro. Por defecto aparece el precio calculado ({formatCurrency(totales.venta)}), puedes ajustarlo si hay extras o descuentos.
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

              <div className="grid grid-cols-3 gap-4">
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
                  <div className="text-sm text-gray-600">Láminas enteras sin cortar</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_retiro: 'metros_cuadrados' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.tipo_retiro === 'metros_cuadrados'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Metros Cuadrados (m²)</div>
                  <div className="text-sm text-gray-600">Ingreso directo de m²</div>
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
                  <div className="font-semibold text-gray-900 mb-1">Metros Lineales (ml)</div>
                  <div className="text-sm text-gray-600">Sobremesas con dimensiones</div>
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
                    ≈ {formatNumber(formData.cantidad_laminas * LAMINA_ML)} metros lineales (aprox. 2 cortes/lámina)
                  </p>
                </div>
              ) : formData.tipo_retiro === 'metros_cuadrados' ? (
                <div className="space-y-4">
                  {/* Ingreso directo de m² */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-3">Cantidad en Metros Cuadrados</h4>
                    <div>
                      <label className="label">Metros Cuadrados (m²) *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.metros_cuadrados}
                        onChange={(e) => setFormData({ ...formData, metros_cuadrados: parseFloat(e.target.value) || 0 })}
                        className="input"
                        placeholder="Ej: 1.5 para una lámina y media"
                        required
                      />
                      <p className="text-sm text-purple-700 mt-2">
                        Se necesitarán <strong>{totales.laminasNecesarias} lámina(s)</strong> ({formatNumber(totales.laminasNecesarias * LAMINA_M2)} m²)
                      </p>
                      {totales.sobranteGenerado > 0.01 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Cada lámina tiene {LAMINA_M2} m². Sobrará {formatNumber(totales.sobranteGenerado)} m²
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sobrantes Disponibles */}
                  {sobrantes.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-green-900 text-lg mb-2 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Sobrantes Disponibles
                          </h4>
                          <div className="bg-white rounded-lg px-6 py-4 border border-green-200">
                            <div className="text-center">
                              <p className="text-4xl font-bold text-green-700">
                                {formatNumber(sobrantesDisponibles)}
                              </p>
                              <p className="text-sm text-green-600 font-medium mt-1">metros cuadrados disponibles (m²)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="uso_sobrantes_m2"
                          checked={formData.uso_sobrantes}
                          onChange={(e) => setFormData({ ...formData, uso_sobrantes: e.target.checked })}
                          className="w-5 h-5 text-green-600 border-green-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="uso_sobrantes_m2" className="font-medium text-green-900 cursor-pointer">
                          Usar sobrantes disponibles primero
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dimensiones del retiro */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Dimensiones del Retiro</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Largo (metros) *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.largo_metros}
                          onChange={(e) => {
                            const largo = parseFloat(e.target.value) || 0
                            const metrosCuadrados = largo * formData.ancho_metros
                            setFormData({ 
                              ...formData, 
                              largo_metros: largo,
                              metros_lineales: metrosCuadrados
                            })
                          }}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Ancho (metros) *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.ancho_metros}
                          onChange={(e) => {
                            const ancho = parseFloat(e.target.value) || 0
                            const metrosCuadrados = formData.largo_metros * ancho
                            setFormData({ 
                              ...formData, 
                              ancho_metros: ancho,
                              metros_lineales: metrosCuadrados
                            })
                          }}
                          className="input"
                          required
                        />
                      </div>
                    </div>
                    {formData.largo_metros > 0 && formData.ancho_metros > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                        <p className="text-sm font-medium text-blue-900">
                          Área total: <span className="text-lg">{formatNumber(formData.metros_lineales)} m²</span>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formData.largo_metros} m × {formData.ancho_metros} m = {formatNumber(formData.metros_lineales)} m²
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Metros Cuadrados (calculado automáticamente)</label>
                    <input
                      type="number"
                      value={formData.metros_lineales}
                      className="input bg-gray-100"
                      readOnly
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Se necesitarán {totales.laminasNecesarias} lámina(s) completa(s) ({formatNumber(totales.laminasNecesarias * LAMINA_M2)} m²)
                    </p>
                    {totales.sobranteGenerado > 0.01 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Cada lámina tiene {LAMINA_M2} m². Sobrará {formatNumber(totales.sobranteGenerado)} m²
                      </p>
                    )}
                  </div>

                  {/* Sobrantes Disponibles */}
                  {sobrantes.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-green-900 text-lg mb-2 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Sobrantes Disponibles para este Material
                          </h4>
                          <div className="bg-white rounded-lg px-6 py-4 border border-green-200">
                            <div className="text-center">
                              <p className="text-4xl font-bold text-green-700">
                                {formatNumber(sobrantesDisponibles)}
                              </p>
                              <p className="text-sm text-green-600 font-medium mt-1">metros cuadrados disponibles (m²)</p>
                              {selectedMaterial?.precio_por_metro && (
                                <p className="text-xs text-green-700 mt-2 font-semibold">
                                  Valor: {formatCurrency(sobrantesDisponibles * selectedMaterial.precio_por_metro)}
                                  <span className="text-gray-500 ml-1">
                                    ({formatCurrency(selectedMaterial.precio_por_metro)}/m²)
                                  </span>
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Sobrantes aprovechables acumulados</p>
                            </div>
                          </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-3 rounded-lg border-2 border-green-400 hover:bg-green-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.uso_sobrantes}
                            onChange={(e) => setFormData({ ...formData, uso_sobrantes: e.target.checked })}
                            className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <div className="text-left">
                            <span className="block text-sm font-bold text-green-900">Usar Sobrantes</span>
                            <span className="block text-xs text-green-600">
                              {formData.uso_sobrantes ? 'Activado ✓' : 'Desactivado'}
                            </span>
                          </div>
                        </label>
                      </div>
                      
                      {/* Comparación: Necesitas vs Disponible */}
                      {formData.metros_lineales > 0 && (
                        <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                          <h5 className="font-semibold text-gray-700 mb-3 text-sm">Análisis de Uso:</h5>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Necesitas</p>
                              <p className="text-xl font-bold text-blue-600">{formatNumber(formData.metros_lineales)} m²</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Disponible en Sobros</p>
                              <p className="text-xl font-bold text-green-600">{formatNumber(sobrantesDisponibles)} m²</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {sobrantesDisponibles >= formData.metros_lineales ? 'Cubierto' : 'Faltante'}
                              </p>
                              <p className={`text-xl font-bold ${sobrantesDisponibles >= formData.metros_lineales ? 'text-green-600' : 'text-orange-600'}`}>
                                {sobrantesDisponibles >= formData.metros_lineales 
                                  ? '✓ 100%' 
                                  : `${formatNumber(formData.metros_lineales - sobrantesDisponibles)} m² más`
                                }
                              </p>
                            </div>
                          </div>
                          
                          {formData.uso_sobrantes && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <p className="text-sm text-green-700">
                                <strong>Láminas necesarias:</strong> {totales.laminasNecesarias} lámina(s)
                                {sobrantesDisponibles >= formData.metros_lineales 
                                  ? ' (No se usarán láminas, solo sobrantes ✓)'
                                  : ` (se completará con sobrantes)`
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Lista de Sobrantes */}
                      <div className="space-y-2">
                        <h5 className="font-semibold text-gray-700 text-sm mb-2">Detalle de Sobrantes:</h5>
                        {sobrantes.map((sobrante) => (
                          <div key={sobrante.id} className="flex justify-between items-center text-sm bg-white rounded-lg px-4 py-3 border border-green-200 hover:border-green-300 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-green-100 rounded-full px-3 py-1">
                                <span className="font-bold text-green-700">{formatNumber(sobrante.metros_lineales)} m²</span>
                              </div>
                              {selectedMaterial?.precio_por_metro && (
                                <div className="bg-blue-50 rounded px-2 py-1">
                                  <span className="text-xs font-semibold text-blue-700">
                                    {formatCurrency(sobrante.metros_lineales * selectedMaterial.precio_por_metro)}
                                  </span>
                                </div>
                              )}
                              {sobrante.proyecto_origen && (
                                <span className="text-gray-600 text-xs">
                                  De: <span className="font-medium">{sobrante.proyecto_origen}</span>
                                </span>
                              )}
                              {sobrante.notas && (
                                <span className="text-xs text-gray-500 italic">({sobrante.notas})</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(sobrante.created_at).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si NO hay sobrantes */}
                  {sobrantes.length === 0 && formData.metros_lineales > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 text-center">
                        ℹ️ No hay sobrantes disponibles para este material
                      </p>
                    </div>
                  )}

                  {totales.sobranteGenerado > 0.01 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Sobrante Generado</h4>
                      <p className="text-sm text-yellow-700">
                        Se generará un sobrante de <span className="font-bold">{formatNumber(totales.sobranteGenerado)} m²</span>
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

        {/* Resumen del Retiro */}
        {selectedMaterial && formData.tipo_retiro === 'metros_lineales' && formData.metros_lineales > 0 && (
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Resumen del Retiro
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lado izquierdo: Lo que se va a usar */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" />
                      Se va a usar:
                    </h3>
                    <div className="space-y-2">
                      {formData.uso_sobrantes && sobrantesDisponibles > 0 ? (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-blue-100">
                            <span className="text-sm text-gray-600">Sobrantes:</span>
                            <span className="font-bold text-green-600">
                              {formatNumber(Math.min(formData.metros_lineales, sobrantesDisponibles))} m²
                            </span>
                          </div>
                          {totales.laminasNecesarias > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-100">
                              <span className="text-sm text-gray-600">Láminas nuevas:</span>
                              <span className="font-bold text-blue-600">
                                {totales.laminasNecesarias} lámina(s) = {formatNumber(totales.laminasNecesarias * LAMINA_M2)} m²
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <span className="text-sm text-gray-600">Láminas completas:</span>
                          <span className="font-bold text-blue-600">
                            {totales.laminasNecesarias} lámina(s) = {formatNumber(totales.laminasNecesarias * LAMINA_M2)} m²
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 bg-blue-50 rounded px-2">
                        <span className="text-sm font-bold text-blue-900">Total necesario:</span>
                        <span className="font-bold text-blue-900 text-lg">
                          {formatNumber(formData.metros_lineales)} m²
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Lo que va a quedar */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Después del retiro quedará:
                    </h3>
                    <div className="space-y-2">
                      {formData.uso_sobrantes && sobrantesDisponibles > 0 ? (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-green-100">
                            <span className="text-sm text-gray-600">Sobrantes restantes:</span>
                            <span className="font-bold text-green-600">
                              {formatNumber(Math.max(0, sobrantesDisponibles - formData.metros_lineales))} m²
                            </span>
                          </div>
                          {totales.sobranteGenerado > 0.01 && (
                            <div className="flex justify-between items-center py-2 border-b border-yellow-100">
                              <span className="text-sm text-gray-600">Nuevo sobrante generado:</span>
                              <span className="font-bold text-yellow-600">
                                + {formatNumber(totales.sobranteGenerado)} m²
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-2 bg-green-50 rounded px-2">
                            <span className="text-sm font-bold text-green-900">Total en sobrantes:</span>
                            <span className="font-bold text-green-900 text-lg">
                              {formatNumber(Math.max(0, sobrantesDisponibles - formData.metros_lineales) + totales.sobranteGenerado)} m²
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {totales.sobranteGenerado > 0.01 && (
                            <>
                              <div className="flex justify-between items-center py-2 border-b border-yellow-100">
                                <span className="text-sm text-gray-600">Nuevo sobrante:</span>
                                <span className="font-bold text-yellow-600">
                                  {formatNumber(totales.sobranteGenerado)} m²
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 bg-yellow-50 rounded px-2">
                                <span className="text-sm font-bold text-yellow-900">Total en sobrantes:</span>
                                <span className="font-bold text-yellow-900 text-lg">
                                  {formatNumber(sobrantesDisponibles + totales.sobranteGenerado)} m²
                                </span>
                              </div>
                            </>
                          )}
                          {totales.sobranteGenerado <= 0.01 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No se generarán sobrantes
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                  {formData.tipo_retiro === 'metros_lineales' && formData.largo_metros > 0 && formData.ancho_metros > 0 && (
                    <div className="text-xs text-blue-500 mt-1">
                      ({formatNumber(formData.largo_metros)} + {formatNumber(formData.ancho_metros)}) ml × {formatCurrency(selectedMaterial?.precio_lineal || 0)}/ml
                    </div>
                  )}
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

              {/* Nota sobre precio lineal */}
              {formData.tipo_retiro === 'metros_lineales' && formData.largo_metros > 0 && formData.ancho_metros > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    📏 Precio calculado por <strong>metros lineales</strong> (Largo + Ancho = {formatNumber(formData.largo_metros + formData.ancho_metros)} ml)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Los sobrantes se gestionan en m² (área), pero la venta se cobra por metros lineales (largo + ancho) para evitar pérdidas
                  </p>
                </div>
              )}

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
