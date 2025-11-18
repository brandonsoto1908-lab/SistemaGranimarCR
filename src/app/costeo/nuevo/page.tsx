// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calculator, Clock, Package, DollarSign, Plus, X } from 'lucide-react'
import Link from 'next/link'

interface Retiro {
  id: string
  proyecto: string
  cliente: string
  costo_total: number
}

interface Insumo {
  id: string
  nombre: string
  precio_unitario: number
  unidad_medida: string
}

interface InsumoUsado {
  insumo_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export default function NuevoCosteoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumosUsados, setInsumosUsados] = useState<InsumoUsado[]>([])
  
  const [formData, setFormData] = useState({
    retiro_id: '',
    proyecto: '',
    costo_material: 0,
    horas_trabajadas: 0,
    tarifa_hora: 0,
    precio_venta: 0,
    porcentaje_material: 15,
    porcentaje_mano_obra: 20,
    porcentaje_insumos: 0.5,
    porcentaje_ahorros: 50
  })

  useEffect(() => {
    fetchRetiros()
    fetchInsumos()
  }, [])

  const fetchRetiros = async () => {
    try {
      const { data, error } = await supabase
        .from('retiros')
        .select('id, proyecto, cliente, costo_total')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setRetiros(data || [])
    } catch (error) {
      console.error('Error fetching retiros:', error)
    }
  }

  const fetchInsumos = async () => {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('id, nombre, precio_unitario, unidad_medida')
        .order('nombre')

      if (error) throw error
      setInsumos(data || [])
    } catch (error) {
      console.error('Error fetching insumos:', error)
    }
  }

  const handleRetiroChange = (retiroId: string) => {
    const retiro = retiros.find(r => r.id === retiroId)
    if (retiro) {
      setFormData({
        ...formData,
        retiro_id: retiroId,
        proyecto: retiro.proyecto,
        costo_material: retiro.costo_total || 0
      })
    }
  }

  const agregarInsumo = () => {
    if (insumos.length === 0) {
      toast.error('No hay insumos disponibles. Agrega insumos primero.')
      return
    }

    const primerInsumo = insumos[0]
    setInsumosUsados([
      ...insumosUsados,
      {
        insumo_id: primerInsumo.id,
        nombre: primerInsumo.nombre,
        cantidad: 1,
        precio_unitario: primerInsumo.precio_unitario,
        subtotal: primerInsumo.precio_unitario
      }
    ])
  }

  const actualizarInsumo = (index: number, field: string, value: any) => {
    const nuevosInsumos = [...insumosUsados]
    const insumoActual = { ...nuevosInsumos[index] }

    if (field === 'insumo_id') {
      const insumoSeleccionado = insumos.find(i => i.id === value)
      if (insumoSeleccionado) {
        insumoActual.insumo_id = value
        insumoActual.nombre = insumoSeleccionado.nombre
        insumoActual.precio_unitario = insumoSeleccionado.precio_unitario
      }
    } else if (field === 'cantidad') {
      insumoActual.cantidad = parseFloat(value) || 0
    }

    insumoActual.subtotal = insumoActual.cantidad * insumoActual.precio_unitario
    nuevosInsumos[index] = insumoActual
    setInsumosUsados(nuevosInsumos)
  }

  const eliminarInsumo = (index: number) => {
    const nuevosInsumos = insumosUsados.filter((_, i) => i !== index)
    setInsumosUsados(nuevosInsumos)
  }

  const calcularCostoInsumos = () => {
    return insumosUsados.reduce((sum, insumo) => sum + insumo.subtotal, 0)
  }

  const calcularCostoManoObra = () => {
    return formData.horas_trabajadas * formData.tarifa_hora
  }

  const calcularCostoTotal = () => {
    return formData.costo_material + calcularCostoManoObra() + calcularCostoInsumos()
  }

  const calcularGanancia = () => {
    return formData.precio_venta - calcularCostoTotal()
  }

  const calcularPorcentajeGanancia = () => {
    if (formData.precio_venta === 0) return 0
    return (calcularGanancia() / formData.precio_venta) * 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.proyecto.trim()) {
      toast.error('El proyecto es obligatorio')
      return
    }

    if (formData.precio_venta <= 0) {
      toast.error('El precio de venta debe ser mayor a 0')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('costeo_produccion')
        .insert([{
          retiro_id: formData.retiro_id || null,
          proyecto: formData.proyecto,
          costo_material: formData.costo_material,
          costo_mano_obra: calcularCostoManoObra(),
          costo_insumos: calcularCostoInsumos(),
          horas_trabajadas: formData.horas_trabajadas,
          tarifa_hora: formData.tarifa_hora,
          precio_venta: formData.precio_venta,
          insumos_detalle: insumosUsados,
          porcentaje_material: formData.porcentaje_material,
          porcentaje_mano_obra: formData.porcentaje_mano_obra,
          porcentaje_insumos: formData.porcentaje_insumos,
          porcentaje_ahorros: formData.porcentaje_ahorros
        }])

      if (error) throw error

      toast.success('Costeo creado exitosamente')
      router.push('/costeo')
    } catch (error: any) {
      console.error('Error creating costeo:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const costoTotal = calcularCostoTotal()
  const ganancia = calcularGanancia()
  const porcentajeGanancia = calcularPorcentajeGanancia()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/costeo" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nuevo Costeo de Producción</h1>
          <p className="page-subtitle">Registrar costos detallados del proyecto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Retiro (opcional) */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Proyecto
            </h2>

            <div>
              <label className="label">Vincular con Retiro (opcional)</label>
              <select
                value={formData.retiro_id}
                onChange={(e) => handleRetiroChange(e.target.value)}
                className="input"
              >
                <option value="">Nuevo proyecto sin retiro</option>
                {retiros.map((retiro) => (
                  <option key={retiro.id} value={retiro.id}>
                    {retiro.proyecto} {retiro.cliente && `- ${retiro.cliente}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Nombre del Proyecto *</label>
              <input
                type="text"
                value={formData.proyecto}
                onChange={(e) => setFormData({ ...formData, proyecto: e.target.value })}
                className="input"
                placeholder="Nombre del proyecto"
                required
              />
            </div>
          </div>
        </div>

        {/* Costos */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Costos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Costo de Material</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo_material}
                  onChange={(e) => setFormData({ ...formData, costo_material: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Porcentaje objetivo: {formData.porcentaje_material}%
                </p>
              </div>

              <div>
                <label className="label">Precio de Venta *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mano de Obra */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mano de Obra
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Horas Trabajadas</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.horas_trabajadas}
                  onChange={(e) => setFormData({ ...formData, horas_trabajadas: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Tarifa por Hora</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tarifa_hora}
                  onChange={(e) => setFormData({ ...formData, tarifa_hora: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Costo Total Mano de Obra: <span className="text-lg">{formatCurrency(calcularCostoManoObra())}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formData.horas_trabajadas} horas × {formatCurrency(formData.tarifa_hora)}/hora | Objetivo: {formData.porcentaje_mano_obra}%
              </p>
            </div>
          </div>
        </div>

        {/* Insumos */}
        <div className="card">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Insumos Utilizados
              </h2>
              <button
                type="button"
                onClick={agregarInsumo}
                className="btn btn-sm btn-secondary"
              >
                <Plus className="w-4 h-4" />
                Agregar Insumo
              </button>
            </div>

            {insumosUsados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay insumos agregados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insumosUsados.map((insumo, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="label text-xs">Insumo</label>
                        <select
                          value={insumo.insumo_id}
                          onChange={(e) => actualizarInsumo(index, 'insumo_id', e.target.value)}
                          className="input input-sm"
                        >
                          {insumos.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nombre} ({formatCurrency(i.precio_unitario)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          value={insumo.cantidad}
                          onChange={(e) => actualizarInsumo(index, 'cantidad', e.target.value)}
                          className="input input-sm"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Subtotal</label>
                        <input
                          type="text"
                          value={formatCurrency(insumo.subtotal)}
                          className="input input-sm bg-gray-100"
                          readOnly
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarInsumo(index)}
                      className="btn btn-sm btn-danger self-end"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900">
                Costo Total Insumos: <span className="text-lg">{formatCurrency(calcularCostoInsumos())}</span>
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Objetivo: {formData.porcentaje_insumos}%
              </p>
            </div>
          </div>
        </div>

        {/* Porcentajes de Distribución */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Distribución de Costos (Porcentajes Objetivo)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Material (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.porcentaje_material}
                  onChange={(e) => setFormData({ ...formData, porcentaje_material: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Mano de Obra (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.porcentaje_mano_obra}
                  onChange={(e) => setFormData({ ...formData, porcentaje_mano_obra: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Insumos (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.porcentaje_insumos}
                  onChange={(e) => setFormData({ ...formData, porcentaje_insumos: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ahorros (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.porcentaje_ahorros}
                  onChange={(e) => setFormData({ ...formData, porcentaje_ahorros: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Final */}
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="card-body">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Resumen de Costeo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Costo Material:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(formData.costo_material)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Costo Mano de Obra:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(calcularCostoManoObra())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Costo Insumos:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(calcularCostoInsumos())}</span>
                </div>
                <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">COSTO TOTAL:</span>
                  <span className="font-bold text-xl text-red-600">{formatCurrency(costoTotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Precio de Venta:</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(formData.precio_venta)}</span>
                </div>
                <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">GANANCIA:</span>
                  <span className={`font-bold text-xl ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(ganancia)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">% Ganancia:</span>
                  <span className={`badge text-lg px-4 py-2 ${
                    porcentajeGanancia >= 40 ? 'badge-success' :
                    porcentajeGanancia >= 20 ? 'badge-info' :
                    porcentajeGanancia >= 10 ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {formatNumber(porcentajeGanancia)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Costeo
              </>
            )}
          </button>
          <Link href="/costeo" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
