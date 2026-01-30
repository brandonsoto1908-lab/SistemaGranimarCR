// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditarAbonoPage() {
  const params = useParams()
  const router = useRouter()
  const prestamoId = params?.id as string
  const abonoId = params?.abonoId as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    monto: 0,
    monto_capital: 0,
    monto_interes: 0,
    saldo_debito: 0,
    poliza: 0,
    tipo_pago: 'efectivo',
    referencia: '',
    fecha_abono: getDateInputValue(),
    notas: '',
  })

  useEffect(() => {
    if (abonoId) fetchAbono()
  }, [abonoId])

  const fetchAbono = async () => {
    try {
      const { data, error } = await supabase
        .from('abonos_prestamos')
        .select('*')
        .eq('id', abonoId)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          monto: parseFloat(data.monto) || 0,
          monto_capital: parseFloat(data.monto_capital) || 0,
          monto_interes: parseFloat(data.monto_interes) || 0,
          saldo_debito: data.saldo_debito != null ? parseFloat(data.saldo_debito) : 0,
          poliza: data.poliza != null ? parseFloat(data.poliza) : 0,
          tipo_pago: data.tipo_pago || 'efectivo',
          referencia: data.referencia || '',
          fecha_abono: data.fecha_abono ? new Date(data.fecha_abono).toISOString().slice(0,10) : getDateInputValue(),
          notas: data.notas || '',
        })
      }
    } catch (error: any) {
      console.error('Error fetching abono:', error)
      toast.error('Error al cargar abono')
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e: any) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.monto <= 0) { toast.error('El monto debe ser mayor a 0'); return }
    if (formData.monto_capital + formData.monto_interes !== formData.monto) {
      toast.error('La suma de capital e interés debe ser igual al monto total')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('abonos_prestamos')
        .update({
          ...formData,
          referencia: formData.referencia || null,
          saldo_debito: formData.saldo_debito || null,
          poliza: formData.poliza || null,
        })
        .eq('id', abonoId)

      if (error) throw error
      toast.success('Abono actualizado')
      router.push(`/gastos/prestamos/${prestamoId}`)
    } catch (error: any) {
      console.error('Error updating abono:', error)
      toast.error('Error al actualizar abono: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este abono?')) return
    try {
      const { error } = await supabase.from('abonos_prestamos').delete().eq('id', abonoId)
      if (error) throw error
      toast.success('Abono eliminado')
      router.push(`/gastos/prestamos/${prestamoId}`)
    } catch (error: any) {
      console.error('Error deleting abono:', error)
      toast.error('Error al eliminar: ' + error.message)
    }
  }

  if (loadingData) return <div className="flex items-center justify-center min-h-[300px]"><div className="spinner spinner-lg"></div></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/gastos/prestamos/${prestamoId}`} className="btn btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Editar Abono</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Monto Total</label>
              <input type="number" name="monto" value={formData.monto} onChange={handleChange} className="input" step="0.01" min="0" required />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" name="fecha_abono" value={formData.fecha_abono} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Monto a Capital</label>
              <input type="number" name="monto_capital" value={formData.monto_capital} onChange={handleChange} className="input" step="0.01" min="0" required />
            </div>
            <div>
              <label className="label">Monto a Interés</label>
              <input type="number" name="monto_interes" value={formData.monto_interes} onChange={handleChange} className="input" step="0.01" min="0" />
            </div>
            <div>
              <label className="label">Saldo Débito</label>
              <input type="number" name="saldo_debito" value={formData.saldo_debito} onChange={handleChange} className="input" step="0.01" min="0" />
            </div>
            <div>
              <label className="label">Póliza (monto)</label>
              <input type="number" name="poliza" value={formData.poliza} onChange={handleChange} className="input" step="0.01" min="0" />
            </div>
            <div>
              <label className="label">Tipo de Pago</label>
              <select name="tipo_pago" value={formData.tipo_pago} onChange={handleChange} className="input">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Referencia</label>
              <input type="text" name="referencia" value={formData.referencia} onChange={handleChange} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notas</label>
              <textarea name="notas" value={formData.notas} onChange={handleChange} className="textarea" rows={3} />
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-end gap-2">
          <button type="button" onClick={handleDelete} className="btn btn-ghost text-red-600">
            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
          </button>
          <Link href={`/gastos/prestamos/${prestamoId}`} className="btn btn-ghost">Cancelar</Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save className="w-4 h-4 mr-1" /> Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
