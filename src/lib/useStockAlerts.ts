// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { StockAlert, shouldAlert, STOCK_LIMITS } from './stockAlerts'
import { sendStockAlertEmail } from './emailService'

export function useStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkStockLevels = async () => {
    try {
      setLoading(true)
      const newAlerts: StockAlert[] = []

      // Verificar materiales (láminas)
      const { data: materiales } = await supabase
        .from('materiales')
        .select('*')
        .order('cantidad_laminas', { ascending: true })

      if (materiales) {
        materiales.forEach(material => {
          if (shouldAlert(material.cantidad_laminas)) {
            newAlerts.push({
              tipo: 'material',
              id: material.id,
              nombre: material.nombre,
              cantidadActual: material.cantidad_laminas,
            })
          }
        })
      }

      // Por ahora no hay sobrantes en esta estructura
      // Se puede agregar después si se necesita

      // Verificar discos y herramientas
      const { data: discos } = await supabase
        .from('discos')
        .select('*')
        .order('cantidad', { ascending: true })

      if (discos) {
        discos.forEach(disco => {
          if (shouldAlert(disco.cantidad)) {
            newAlerts.push({
              tipo: 'disco',
              id: disco.id,
              nombre: disco.nombre,
              cantidadActual: disco.cantidad,
              categoria: disco.tipo,
              material: disco.material_compatible,
            })
          }
        })
      }

      setAlerts(newAlerts)
      setLastCheck(new Date())

      // Enviar email inmediatamente si hay productos sin stock
      if (newAlerts.length > 0) {
        console.log('🚫 Productos sin stock detectados:', newAlerts.length)
        console.log('📧 Enviando email de alerta...')
        
        try {
          const emailSent = await sendStockAlertEmail(newAlerts)
          if (emailSent) {
            console.log('✅ Email enviado exitosamente')
          } else {
            console.error('❌ Error al enviar email')
          }
        } catch (error) {
          console.error('❌ Error al intentar enviar email:', error)
        }
      }

      return newAlerts
    } catch (error) {
      console.error('Error checking stock levels:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStockLevels()

    // Verificar cada 30 minutos
    const interval = setInterval(() => {
      checkStockLevels()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    alerts,
    loading,
    lastCheck,
    totalAlerts: alerts.length,
    refresh: checkStockLevels,
  }
}
