// @ts-nocheck
'use client'

import { useStockAlerts } from '@/lib/useStockAlerts'
import { AlertTriangle, Package, X, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function StockAlertBanner() {
  const { alerts, loading, totalAlerts, lastCheck, refresh } = useStockAlerts()
  const [isVisible, setIsVisible] = useState(true)

  if (loading || totalAlerts === 0 || !isVisible) {
    return null
  }

  const materialesAlerts = alerts.filter(a => a.tipo === 'material')
  const sobrantesAlerts = alerts.filter(a => a.tipo === 'sobrante')
  const discosAlerts = alerts.filter(a => a.tipo === 'disco')

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-amber-900">
              ⚠️ Alerta de Stock Bajo ({totalAlerts} producto{totalAlerts !== 1 ? 's' : ''})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="btn btn-sm btn-ghost text-amber-700"
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="btn btn-sm btn-ghost text-amber-700"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-amber-800">
            {materialesAlerts.length > 0 && (
              <div>
                <strong>📦 Láminas ({materialesAlerts.length}):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {materialesAlerts.map(alert => (
                    <li key={alert.id}>
                      {alert.nombre} - Stock: <strong>{alert.cantidadActual}</strong> 
                      {alert.material && ` (${alert.material})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sobrantesAlerts.length > 0 && (
              <div>
                <strong>🔲 Sobrantes ({sobrantesAlerts.length}):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {sobrantesAlerts.map(alert => (
                    <li key={alert.id}>
                      {alert.nombre} - Stock: <strong>{alert.cantidadActual}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {discosAlerts.length > 0 && (
              <div>
                <strong>⚙️ Discos/Herramientas ({discosAlerts.length}):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {discosAlerts.map(alert => (
                    <li key={alert.id}>
                      {alert.nombre} - Stock: <strong>{alert.cantidadActual}</strong>
                      {alert.categoria && ` (${alert.categoria})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-amber-700">
            <span>
              Última verificación: {lastCheck ? new Date(lastCheck).toLocaleTimeString('es-ES') : 'N/A'}
            </span>
            <Link href="/inventario" className="btn btn-sm btn-warning">
              <Package className="w-4 h-4" />
              Ver Inventario
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
