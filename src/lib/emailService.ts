import { StockAlert, formatStockAlert, ALERT_EMAIL } from './stockAlerts'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendStockAlertEmail(alerts: StockAlert[]): Promise<boolean> {
  if (alerts.length === 0) return false

  const alertsList = alerts
    .map(alert => formatStockAlert(alert))
    .join('\n')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #0d9488;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .alert-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
          }
          .alert-details {
            color: #78350f;
            font-size: 14px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .count {
            background-color: #dc2626;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚫 Alerta: Productos Sin Stock - Granimar CR</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Se han detectado <span class="count">${alerts.length}</span> producto(s) SIN STOCK en el inventario:</p>
            
            ${alerts.map(alert => `
              <div class="alert">
                <div class="alert-title">
                  ${alert.tipo === 'material' ? '📦 Lámina' : 
                    alert.tipo === 'sobrante' ? '🔲 Sobrante' : 
                    '⚙️ Disco/Herramienta'}: ${alert.nombre}
                </div>
                <div class="alert-details">
                  <strong style="color: #dc2626;">🚫 SIN STOCK (0 unidades)</strong>
                  ${alert.categoria ? `<br>Categoría: ${alert.categoria}` : ''}
                  ${alert.material ? `<br>Material: ${alert.material}` : ''}
                </div>
              </div>
            `).join('')}
            
            <p style="margin-top: 20px;">
              Por favor, revisa el inventario y considera hacer un pedido de reposición.
            </p>
            <p>
              <a href="http://localhost:3001/inventario" 
                 style="background-color: #0d9488; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Inventario
              </a>
            </p>
          </div>
          <div class="footer">
            Sistema de Gestión Granimar CR<br>
            Este es un correo automático, por favor no responder.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    console.log('📧 Intentando enviar email a:', ALERT_EMAIL)
    console.log('📊 Alertas a enviar:', alerts.length)
    
    // Usar la API de Resend o cualquier servicio de email
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ALERT_EMAIL,
        subject: `🚫 URGENTE: ${alerts.length} producto(s) SIN STOCK - Granimar CR`,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error enviando email:', errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Email enviado exitosamente:', result)
    return true
  } catch (error) {
    console.error('❌ Error en sendStockAlertEmail:', error)
    return false
  }
}

// Función alternativa usando un servicio de email simple (EmailJS, etc.)
export function generateEmailBody(alerts: StockAlert[]): string {
  let body = `🚫 ALERTA: PRODUCTOS SIN STOCK - Granimar CR\n\n`
  body += `Se han detectado ${alerts.length} producto(s) SIN STOCK:\n\n`
  
  alerts.forEach((alert, index) => {
    body += `${index + 1}. ${formatStockAlert(alert)}\n`
    if (alert.categoria) body += `   Categoría: ${alert.categoria}\n`
    if (alert.material) body += `   Material: ${alert.material}\n`
    body += `\n`
  })
  
  body += `\n⚠️ URGENTE: Por favor, revisa el inventario y realiza un pedido de reposición inmediatamente.\n`
  body += `\nAccede al sistema: http://localhost:3001/inventario`
  
  return body
}
