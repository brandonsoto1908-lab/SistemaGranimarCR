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
        .order('cantidad', { ascending: true })

      if (materiales) {
        materiales.forEach(material => {
          if (shouldAlert(material.cantidad, 'materiales')) {
            newAlerts.push({
              tipo: 'material',
              id: material.id,
              nombre: material.nombre,
              cantidadActual: material.cantidad,
              limiteMinimo: STOCK_LIMITS.materiales,
              material: material.material,
            })
          }
        })
      }

      // Verificar sobrantes
      const { data: sobrantes } = await supabase
        .from('materiales')
        .select('*')
        .eq('es_sobrante', true)
        .order('cantidad', { ascending: true })

      if (sobrantes) {
        sobrantes.forEach(sobrante => {
          if (shouldAlert(sobrante.cantidad, 'sobrantes')) {
            newAlerts.push({
              tipo: 'sobrante',
              id: sobrante.id,
              nombre: `${sobrante.nombre} (Sobrante)`,
              cantidadActual: sobrante.cantidad,
              limiteMinimo: STOCK_LIMITS.sobrantes,
              material: sobrante.material,
            })
          }
        })
      }

      // Verificar discos y herramientas
      const { data: discos } = await supabase
        .from('discos')
        .select('*')
        .order('cantidad', { ascending: true })

      if (discos) {
        discos.forEach(disco => {
          if (shouldAlert(disco.cantidad, 'discos')) {
            newAlerts.push({
              tipo: 'disco',
              id: disco.id,
              nombre: disco.nombre,
              cantidadActual: disco.cantidad,
              limiteMinimo: STOCK_LIMITS.discos,
              categoria: disco.tipo,
              material: disco.material_compatible,
            })
          }
        })
      }

      setAlerts(newAlerts)
      setLastCheck(new Date())

      // Enviar email solo si hay alertas nuevas y no se ha enviado en las últimas 24 horas
      if (newAlerts.length > 0) {
        const lastEmailSent = localStorage.getItem('lastStockAlertEmail')
        const now = new Date().getTime()
        const oneDay = 24 * 60 * 60 * 1000 // 24 horas en milisegundos

        if (!lastEmailSent || now - parseInt(lastEmailSent) > oneDay) {
          const emailSent = await sendStockAlertEmail(newAlerts)
          if (emailSent) {
            localStorage.setItem('lastStockAlertEmail', now.toString())
          }
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
