// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatCurrencyWithCRC } from '@/lib/utils'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface RetiroPendiente {
  id: string
  proyecto: string
  cliente: string
  fecha_retiro: string
  precio_venta_total: number
  material: string
  cantidad_laminas: number
}

export default function RetirosPendientesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [retiros, setRetiros] = useState<RetiroPendiente[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [preciosOverrides, setPreciosOverrides] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchRetirosPendientes()
  }, [])

  const fetchRetirosPendientes = async () => {
    try {
      // Obtener todos los retiros con precio_venta_total > 0
      const { data: todosRetiros, error: retirosError } = await supabase
        .from('retiros')
        .select(`
          id, 
          proyecto, 
          cliente, 
          fecha_retiro, 
          precio_venta_total,
          precio_cobrado_total,
          cantidad_laminas,
          metros_lineales,
          tipo_material,
          cantidad_material,
          unidad_material,
          materiales!retiros_material_id_fkey(nombre)
        `)
        .or('precio_venta_total.gt.0,precio_cobrado_total.gt.0')
        .order('fecha_retiro', { ascending: false })

      if (retirosError) {
        console.error('Error fetching retiros:', retirosError)
        throw retirosError
      }

      // Obtener IDs de retiros que ya tienen factura
      const { data: facturasExistentes, error: facturasError } = await supabase
        .from('facturacion')
        .select('retiro_id')
        .not('retiro_id', 'is', null)

      if (facturasError) {
        console.error('Error fetching facturas:', facturasError)
        throw facturasError
      }

      // Filtrar retiros que NO tienen factura
      const idsConFactura = new Set(
        (facturasExistentes || [])
          .filter(f => f.retiro_id !== null)
          .map(f => f.retiro_id)
      )
      
      // Transformar los datos para incluir el nombre del material
      const retirosTransformados = (todosRetiros || []).map(r => ({
        id: r.id,
        proyecto: r.proyecto,
        cliente: r.cliente,
        fecha_retiro: r.fecha_retiro,
        // Preferir el precio cobrado si existe, sino el precio calculado
        precio_venta_total: r.precio_cobrado_total ?? r.precio_venta_total,
        cantidad_laminas: r.cantidad_laminas,
        material: (r.tipo_material ?? r.materiales?.nombre) || 'N/A',
        cantidad_material: r.cantidad_material ?? r.cantidad_laminas ?? r.metros_lineales ?? null,
        unidad_material: r.unidad_material || (r.cantidad_laminas ? 'láminas' : (r.metros_lineales ? 'ml' : null))
      }))
      
      const retirosSinFactura = retirosTransformados.filter(r => !idsConFactura.has(r.id))

      // Inicializar overrides con el precio por defecto
      const overrides: Record<string, number> = {}
      (retirosSinFactura || []).forEach(r => { overrides[r.id] = r.precio_venta_total || 0 })
      setPreciosOverrides(overrides)

      console.log('Total retiros:', todosRetiros?.length || 0)
      console.log('Retiros con factura:', idsConFactura.size)
      console.log('Retiros sin factura:', retirosSinFactura.length)

      setRetiros(retirosSinFactura)
    } catch (error) {
      console.error('Error fetching retiros pendientes:', error)
      toast.error('Error al cargar retiros pendientes')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccion = (retiroId: string) => {
    const nuevaSeleccion = new Set(seleccionados)
    if (nuevaSeleccion.has(retiroId)) {
      nuevaSeleccion.delete(retiroId)
    } else {
      nuevaSeleccion.add(retiroId)
    }
    setSeleccionados(nuevaSeleccion)
  }

  const seleccionarTodos = () => {
    if (seleccionados.size === retiros.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(retiros.map(r => r.id)))
    }
  }

  const generarFacturas = async () => {
    if (seleccionados.size === 0) {
      toast.error('Selecciona al menos un retiro')
      return
    }

    setProcesando(true)

    try {
      const retirosSeleccionados = retiros.filter(r => seleccionados.has(r.id))
      // Permitir al usuario indicar un número de factura base (opcional)
      const baseNumero = window.prompt('Número de factura (dejar vacío para auto)')
      const facturasCreadas = []
      const facturasError = []

      for (let idx = 0; idx < retirosSeleccionados.length; idx++) {
        const retiro = retirosSeleccionados[idx]
        try {
          // Asegurar que el campo `cliente` no sea nulo (la tabla tiene NOT NULL)
          const clienteValor = retiro.cliente && retiro.cliente.trim() ? retiro.cliente : 'Cliente no definido'
          if (!retiro.cliente) console.warn(`Retiro ${retiro.id} sin cliente definido — usando '${clienteValor}' como fallback`)

          const montoParaFactura = preciosOverrides[retiro.id] ?? retiro.precio_venta_total

          const numeroFacturaToUse = baseNumero ? (retirosSeleccionados.length > 1 ? `${baseNumero}-${idx+1}` : baseNumero) : undefined
          const { data, error } = await supabase
            .from('facturacion')
            .insert({
              retiro_id: retiro.id,
              proyecto: retiro.proyecto,
              cliente: clienteValor,
              monto_total: montoParaFactura,
              monto_pagado: 0,
              estado: 'pendiente',
              fecha_factura: new Date().toISOString().split('T')[0],
              notas: `Factura generada automáticamente desde retiro del ${new Date(retiro.fecha_retiro).toLocaleDateString('es-CR')}`,
              numero_factura: numeroFacturaToUse || undefined,
              tipo_material: retiro.material || null,
              cantidad_material: retiro.cantidad_material ?? retiro.cantidad_laminas ?? retiro.metros_lineales ?? null,
              unidad_material: retiro.unidad_material || (retiro.cantidad_laminas != null ? 'láminas' : (retiro.metros_lineales != null ? 'm' : null))
            })
            .select()
            .single()

          if (error) throw error
          facturasCreadas.push(retiro.proyecto)
        } catch (error) {
          console.error(`Error creando factura para ${retiro.proyecto}:`, error)
          facturasError.push(retiro.proyecto)
        }
      }

      if (facturasCreadas.length > 0) {
        toast.success(`${facturasCreadas.length} factura(s) generadas correctamente`)
      }

      if (facturasError.length > 0) {
        toast.error(`Error al generar ${facturasError.length} factura(s)`)
      }

      // Redirigir a la página de facturación
      router.push('/facturacion')
    } catch (error) {
      console.error('Error generando facturas:', error)
      toast.error('Error al generar facturas')
    } finally {
      setProcesando(false)
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/facturacion" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Retiros Pendientes de Facturación</h1>
          <p className="page-subtitle">
            Genera facturas automáticamente desde los retiros registrados
          </p>
        </div>
        {seleccionados.size > 0 && (
          <button
            onClick={generarFacturas}
            disabled={procesando}
            className="btn btn-success"
          >
            {procesando ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generar {seleccionados.size} Factura(s)
              </>
            )}
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="stat-icon bg-blue-100">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Retiros Pendientes</p>
            <p className="stat-value text-blue-600">{retiros.length}</p>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-teal-50 to-teal-100">
          <div className="stat-icon bg-teal-100">
            <CheckCircle className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="stat-label">Seleccionados</p>
            <p className="stat-value text-teal-600">{seleccionados.size}</p>
          </div>
        </div>

              <div className="stat-card bg-gradient-to-br from-green-50 to-green-100">
          <div className="stat-icon bg-green-100">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="stat-label">Total a Facturar</p>
            <p className="stat-value text-green-600">
              {formatCurrencyWithCRC(
                retiros
                  .filter(r => seleccionados.has(r.id))
                  .reduce((sum, r) => sum + (preciosOverrides[r.id] ?? r.precio_venta_total || 0), 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Retiros */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">Retiros sin Factura</h2>
          {retiros.length > 0 && (
            <button
              onClick={seleccionarTodos}
              className="btn btn-sm btn-secondary"
            >
              {seleccionados.size === retiros.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </button>
          )}
        </div>
        <div className="card-body p-0">
          {retiros.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                ¡Todos los retiros tienen factura!
              </p>
              <p className="text-gray-500 mb-4">
                No hay retiros pendientes de facturación
              </p>
              <Link href="/facturacion" className="btn btn-primary">
                Ver Facturas
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === retiros.length && retiros.length > 0}
                        onChange={seleccionarTodos}
                        className="checkbox"
                      />
                    </th>
                    <th>Fecha Retiro</th>
                    <th>Proyecto</th>
                    <th>Cliente</th>
                    <th>Material</th>
                    <th>Láminas</th>
                    <th>Monto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {retiros.map((retiro) => (
                    <tr 
                      key={retiro.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        seleccionados.has(retiro.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSeleccion(retiro.id)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(retiro.id)}
                          onChange={() => toggleSeleccion(retiro.id)}
                          className="checkbox"
                        />
                      </td>
                      <td className="text-gray-700">
                        {new Date(retiro.fecha_retiro).toLocaleDateString('es-CR')}
                      </td>
                      <td className="font-semibold text-gray-900">
                        {retiro.proyecto}
                      </td>
                      <td className="text-gray-700">
                        {retiro.cliente}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {retiro.material}
                        </span>
                      </td>
                      <td className="text-center text-gray-700">
                        {retiro.cantidad_laminas}
                      </td>
                      <td className="font-bold text-green-600">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={preciosOverrides[retiro.id] ?? retiro.precio_venta_total}
                            onChange={(e) => {
                              e.stopPropagation()
                              const v = parseFloat(e.target.value) || 0
                              setPreciosOverrides(prev => ({ ...prev, [retiro.id]: v }))
                            }}
                            className="input input-sm w-32"
                            title="Precio a cobrar (editable)"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="text-sm text-gray-600">{formatCurrencyWithCRC(preciosOverrides[retiro.id] ?? retiro.precio_venta_total)}</div>
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

      {/* Información */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">
                ¿Cómo funciona la generación automática?
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Selecciona los retiros que deseas facturar</li>
                <li>• Se crearán facturas automáticamente con la información del retiro</li>
                <li>• Las facturas se crearán con estado "Pendiente" y monto pagado $0.00</li>
                <li>• Podrás gestionar los pagos y abonos desde el módulo de facturación</li>
                <li>• Los retiros facturados no aparecerán nuevamente en esta lista</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
