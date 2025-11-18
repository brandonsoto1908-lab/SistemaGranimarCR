// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, FileText, DollarSign, User } from 'lucide-react'
import Link from 'next/link'

interface Retiro {
  id: string
  proyecto: string
  cliente: string
  precio_venta_total: number
  fecha_retiro: string
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [formData, setFormData] = useState({
    retiro_id: '',
    proyecto: '',
    cliente: '',
    monto_total: 0,
    fecha_factura: new Date().toISOString().split('T')[0],
    notas: ''
  })

  useEffect(() => {
    fetchRetiros()
  }, [])

  const fetchRetiros = async () => {
    try {
      // Buscar retiros que NO tengan factura aún
      const { data: facturasExistentes, error: errorFacturas } = await supabase
        .from('facturacion')
        .select('retiro_id')

      if (errorFacturas) throw errorFacturas

      const retirosConFactura = facturasExistentes?.map(f => f.retiro_id).filter(Boolean) || []

      const { data, error } = await supabase
        .from('retiros')
        .select('id, proyecto, cliente, precio_venta_total, fecha_retiro')
        .not('id', 'in', `(${retirosConFactura.join(',')})`)
        .order('fecha_retiro', { ascending: false })
        .limit(100)

      if (error) throw error
      setRetiros(data || [])
    } catch (error) {
      console.error('Error fetching retiros:', error)
    }
  }

  const handleRetiroChange = (retiroId: string) => {
    const retiro = retiros.find(r => r.id === retiroId)
    if (retiro) {
      setFormData({
        ...formData,
        retiro_id: retiroId,
        proyecto: retiro.proyecto,
        cliente: retiro.cliente || '',
        monto_total: retiro.precio_venta_total || 0
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.proyecto.trim()) {
      toast.error('El proyecto es obligatorio')
      return
    }

    if (!formData.cliente.trim()) {
      toast.error('El cliente es obligatorio')
      return
    }

    if (formData.monto_total <= 0) {
      toast.error('El monto total debe ser mayor a 0')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('facturacion')
        .insert([{
          retiro_id: formData.retiro_id || null,
          proyecto: formData.proyecto,
          cliente: formData.cliente,
          monto_total: formData.monto_total,
          fecha_factura: formData.fecha_factura,
          notas: formData.notas || null,
          estado: 'pendiente',
          monto_pagado: 0
        }])
        .select()
        .single()

      if (error) throw error

      toast.success('Factura creada exitosamente')
      router.push(`/facturacion/${data.id}`)
    } catch (error: any) {
      console.error('Error creating factura:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/facturacion" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Nueva Factura</h1>
          <p className="page-subtitle">Crear una nueva factura para un proyecto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Retiro */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información del Proyecto
            </h2>

            <div>
              <label className="label">Vincular con Retiro (opcional)</label>
              <select
                value={formData.retiro_id}
                onChange={(e) => handleRetiroChange(e.target.value)}
                className="input"
              >
                <option value="">Factura independiente (sin retiro)</option>
                {retiros.map((retiro) => (
                  <option key={retiro.id} value={retiro.id}>
                    {retiro.proyecto} - {retiro.cliente || 'Sin cliente'} - {formatCurrency(retiro.precio_venta_total)}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Solo se muestran retiros sin factura asignada
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="label">Cliente *</label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="input"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Montos */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Monto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Monto Total *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_total}
                  onChange={(e) => setFormData({ ...formData, monto_total: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="label">Fecha de Factura *</label>
                <input
                  type="date"
                  value={formData.fecha_factura}
                  onChange={(e) => setFormData({ ...formData, fecha_factura: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-900 font-medium">Monto Total a Facturar</p>
                  <p className="text-xs text-blue-600 mt-1">Este será el monto que el cliente debe pagar</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(formData.monto_total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold">Notas Adicionales</h2>

            <div>
              <label className="label">Notas (opcional)</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="input"
                rows={4}
                placeholder="Observaciones, condiciones de pago, etc."
              />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="card bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <div className="card-body">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de la Factura</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                <span className="text-gray-700">Proyecto:</span>
                <span className="font-semibold text-gray-900">{formData.proyecto || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                <span className="text-gray-700">Cliente:</span>
                <span className="font-semibold text-gray-900">{formData.cliente || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                <span className="text-gray-700">Fecha:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(formData.fecha_factura).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">TOTAL A COBRAR:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(formData.monto_total)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Estado inicial:</strong> Pendiente de pago
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Podrás registrar pagos y abonos una vez creada la factura
              </p>
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
                Crear Factura
              </>
            )}
          </button>
          <Link href="/facturacion" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
