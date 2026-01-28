// @ts-nocheck
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency as formatUSD, formatCRC, formatNumber, getUSDToCRC, getUSDToCRCAsync } from './utils'

interface Factura {
  id: string
  proyecto: string
  cliente: string
  numero_factura?: string | null
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  estado: string
  porcentaje_pagado: number
  fecha_factura: string
  fecha_pago_completo: string | null
  notas: string
  tipo_material?: string | null
  cantidad_material?: number | null
  unidad_material?: string | null
}

interface Pago {
  id: string
  monto: number
  tipo_pago: string
  referencia: string
  fecha_pago: string
  notas: string
}

export const generarPDFFactura = async (
  factura: Factura,
  pagos: Pago[],
  materiales: { nombre: string; cantidad: number; unidad?: string }[] = []
) => {
  const doc = new jsPDF()
  // Intentar cargar una fuente TTF desde /fonts para soportar el símbolo ₡
  let embeddedFont = false
  const fontName = 'NotoSans'
  try {
    const res = await fetch('/fonts/NotoSans-Regular.ttf')
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      // Convertir ArrayBuffer a base64 (forma segura)
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)
      ;(doc as any).addFileToVFS('NotoSans-Regular.ttf', base64)
      ;(doc as any).addFont('NotoSans-Regular.ttf', fontName, 'normal')
      // Establecer la fuente embebida para todo el documento
      try {
        (doc as any).setFont(fontName, 'normal')
      } catch (e) {
        // algunos builds esperan setFont en vez de setFontFamily
        doc.setFont(fontName)
      }
      embeddedFont = true
    }
  } catch (e) {
    // Si falla la carga, continuar con helvetica
    embeddedFont = false
  }
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [20, 184, 166] // Teal-600
  const textColor: [number, number, number] = [31, 41, 55] // Gray-800
  const lightGray: [number, number, number] = [243, 244, 246] // Gray-100
  
  let yPosition = 20

  // ========== ENCABEZADO ==========
  // Logo/Título
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text('GRANIMAR CR', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
  doc.text('Sistema de Gestión de Producción', 20, 27)
  
  // Información de la empresa (derecha)
  doc.setFontSize(8)
  doc.text('Tel: +506 62640388', 150, 15, { align: 'left' })
  doc.text('granimarcr@gmail.com', 150, 20, { align: 'left' })
  doc.text('San José, Costa Rica', 150, 25, { align: 'left' })
  
  yPosition = 45

  // ========== TÍTULO DE FACTURA ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(18)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text('FACTURA', 105, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
  const numeroDisplay = factura.numero_factura ? String(factura.numero_factura) : factura.id.slice(0, 8).toUpperCase()
  doc.text(`No. ${numeroDisplay}`, 105, yPosition, { align: 'center' })
  
  yPosition += 15

  // ========== INFORMACIÓN DEL CLIENTE Y PROYECTO ==========
  // Marco izquierdo - Cliente
  doc.setFillColor(...lightGray)
  doc.rect(20, yPosition, 85, 35, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(20, yPosition, 85, 35, 'S')
  
  doc.setFontSize(9)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('INFORMACIÓN DEL CLIENTE', 25, yPosition + 7)
  
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Cliente:', 25, yPosition + 15)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text(factura.cliente, 25, yPosition + 20)
  
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
  doc.text('Proyecto:', 25, yPosition + 26)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text(factura.proyecto, 25, yPosition + 31)
  
  // Información del material usado (si está disponible)
  if ((factura as any).tipo_material) {
    doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Material:', 25, yPosition + 37)
    doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
    const materialText = `${(factura as any).tipo_material} ${((factura as any).cantidad_material != null ? '- ' + String((factura as any).cantidad_material) + ' ' + ((factura as any).unidad_material || '') : '')}`
    doc.text(materialText, 25, yPosition + 42)
  }
  
  // Marco derecho - Fechas
  doc.setFillColor(...lightGray)
  doc.rect(110, yPosition, 80, 35, 'F')
  doc.rect(110, yPosition, 80, 35, 'S')
  
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('INFORMACIÓN DE PAGO', 115, yPosition + 7)
  
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Fecha Factura:', 115, yPosition + 15)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text(new Date(factura.fecha_factura).toLocaleDateString('es-CR'), 115, yPosition + 20)
  
  if (factura.fecha_pago_completo) {
    doc.setFont('helvetica', 'normal')
    doc.text('Fecha Pago Completo:', 115, yPosition + 26)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94) // Green-600
    doc.text(new Date(factura.fecha_pago_completo).toLocaleDateString('es-CR'), 115, yPosition + 31)
    doc.setTextColor(...textColor)
  }
  
  yPosition += 45

  // ========== ESTADO DE LA FACTURA ==========
  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { text: 'PAGADO', color: [34, 197, 94] as [number, number, number] }
      case 'abonado':
        return { text: 'PAGO PARCIAL', color: [234, 179, 8] as [number, number, number] }
      case 'pendiente':
        return { text: 'PENDIENTE', color: [239, 68, 68] as [number, number, number] }
      default:
        return { text: estado.toUpperCase(), color: [107, 114, 128] as [number, number, number] }
    }
  }
  
  const estadoInfo = getEstadoInfo(factura.estado)
  doc.setFillColor(...estadoInfo.color)
  doc.rect(20, yPosition, 170, 10, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text(`ESTADO: ${estadoInfo.text} (${factura.porcentaje_pagado.toFixed(2)}%)`, 105, yPosition + 7, { align: 'center' })
  
  yPosition += 18

  // ========== RESUMEN DE MONTOS ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont(embeddedFont ? fontName : 'helvetica', 'bold')
  doc.text('RESUMEN DE MONTOS', 20, yPosition)
  
  yPosition += 8

  // Tabla de montos
  // For reliability across PDF viewers, always show CRC with readable fallback.
  // Using the raw '₡' glyph can render incorrectly in some viewers; prefer the '(CRC)' suffix.
  const formatCRCLocal = async (value: number, date?: string) => {
    const rate = await getUSDToCRCAsync(date)
    const crcValue = (value || 0) * rate
    const formatted = new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(crcValue)
    return `${formatted} (CRC)`
  }

  // Because formatCRCLocal is async, resolve the CRC values first
  // Use factura.fecha_factura to fetch historical rate for the invoice date
  const fecha = factura.fecha_factura ? (new Date(factura.fecha_factura).toISOString().split('T')[0]) : undefined
  const montoTotalCRC = await formatCRCLocal(factura.monto_total, fecha)
  const montoPagadoCRC = await formatCRCLocal(factura.monto_pagado, fecha)
  const montoPendienteCRC = await formatCRCLocal(factura.monto_pendiente, fecha)

  const montosData = [
    ['Monto Total', formatUSD(factura.monto_total), montoTotalCRC],
    ['Monto Pagado', formatUSD(factura.monto_pagado), montoPagadoCRC],
    ['Monto Pendiente', formatUSD(factura.monto_pendiente), montoPendienteCRC],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [[
      'Concepto', 
      'Monto $', 
      'Monto (CRC)'
    ]],
    body: montosData,
    theme: 'grid',
    styles: { font: embeddedFont ? fontName : 'helvetica' },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 20, right: 20 },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 15

  // ========== HISTORIAL DE PAGOS ==========
  if (pagos.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`HISTORIAL DE PAGOS (${pagos.length})`, 20, yPosition)
    
    yPosition += 8

    const pagosData = pagos.map(pago => [
      new Date(pago.fecha_pago).toLocaleDateString('es-CR'),
      formatUSD(pago.monto),
      formatCRCLocal(pago.monto),
      pago.tipo_pago,
      pago.referencia || '-',
      pago.notas || '-',
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [[
        'Fecha',
        'Monto $',
        'Monto (CRC)',
        'Método',
        'Referencia',
        'Notas'
      ]],
      body: pagosData,
      theme: 'striped',
      styles: { font: embeddedFont ? fontName : 'helvetica' },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 40 },
      },
      margin: { left: 20, right: 20 },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

    // ========== DETALLE DE MATERIALES USADOS (por sobre) ==========
    if (materiales && materiales.length > 0) {
      // Verificar espacio
      if (yPosition > 240) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DE MATERIALES', 20, yPosition)

      yPosition += 8

      const materialesData = materiales.map(m => [
        m.nombre || 'N/A',
        typeof m.cantidad === 'number' ? formatNumber(m.cantidad, 2) : '-',
        m.unidad || '-'
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Material', 'Cantidad', 'Unidad']],
        body: materialesData,
        theme: 'striped',
        styles: { font: embeddedFont ? fontName : 'helvetica' },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: 20, right: 20 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

  // ========== NOTAS ==========
  if (factura.notas) {
    // Verificar si hay espacio, si no, agregar nueva página
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS ADICIONALES', 20, yPosition)
    
    yPosition += 6
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const notasLines = doc.splitTextToSize(factura.notas, 170)
    doc.text(notasLines, 20, yPosition)
    
    yPosition += notasLines.length * 4 + 10
  }

  // ========== PIE DE PÁGINA ==========
  const pageCount = (doc as any).internal.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 280, 190, 280)
    
    // Texto del pie
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Granimar CR - Sistema de Gestión de Producción', 105, 285, { align: 'center' })
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' })
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CR')} a las ${new Date().toLocaleTimeString('es-CR')}`, 20, 290)
  }

  // Guardar PDF
  const fileName = `Factura_${factura.proyecto.replace(/[^a-z0-9]/gi, '_')}_${factura.id.slice(0, 8)}.pdf`
  doc.save(fileName)
}

// Usar `formatCurrencyWithCRC` desde `src/lib/utils.ts` para mostrar USD + CRC

// Generar PDF de reporte por período
export const generarPDFReportePeriodo = (
  facturas: Factura[],
  periodo: string,
  fechaInicio: string,
  fechaFin: string
) => {
  const doc = new jsPDF()
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [20, 184, 166]
  const textColor: [number, number, number] = [31, 41, 55]
  const lightGray: [number, number, number] = [243, 244, 246]
  
  let yPosition = 20

  // ========== ENCABEZADO ==========
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('GRANIMAR CR', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Facturación por Período', 20, 27)
  
  yPosition = 45

  // ========== TÍTULO DEL REPORTE ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`REPORTE DE ${periodo.toUpperCase()}`, 105, yPosition, { align: 'center' })
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Del ${new Date(fechaInicio).toLocaleDateString('es-CR')} al ${new Date(fechaFin).toLocaleDateString('es-CR')}`,
    105,
    yPosition,
    { align: 'center' }
  )
  
  yPosition += 15

  // ========== RESUMEN GENERAL ==========
  const totalFacturas = facturas.length
  const totalFacturado = facturas.reduce((sum, f) => sum + f.monto_total, 0)
  const totalCobrado = facturas.reduce((sum, f) => sum + f.monto_pagado, 0)
  const totalPendiente = facturas.reduce((sum, f) => sum + f.monto_pendiente, 0)
  const facturasPagadas = facturas.filter(f => f.estado === 'pagado').length
  const facturasAbonadas = facturas.filter(f => f.estado === 'abonado').length
  const facturasPendientes = facturas.filter(f => f.estado === 'pendiente').length
  const tasaCobranza = totalFacturado > 0 ? (totalCobrado / totalFacturado * 100) : 0

  doc.setFillColor(...lightGray)
  doc.rect(20, yPosition, 170, 50, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(20, yPosition, 170, 50, 'S')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...textColor)
  doc.text('RESUMEN EJECUTIVO', 25, yPosition + 8)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  // Primera columna
  doc.text('Total Facturas:', 25, yPosition + 18)
  doc.setFont('helvetica', 'bold')
  doc.text(String(totalFacturas), 70, yPosition + 18)
  
  doc.setFont('helvetica', 'normal')
  doc.text('Facturas Pagadas:', 25, yPosition + 25)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text(String(facturasPagadas), 70, yPosition + 25)
  
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Facturas Abonadas:', 25, yPosition + 32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 179, 8)
  doc.text(String(facturasAbonadas), 70, yPosition + 32)
  
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Facturas Pendientes:', 25, yPosition + 39)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text(String(facturasPendientes), 70, yPosition + 39)
  
  // Segunda columna
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Facturado:', 105, yPosition + 18)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrencyWithCRC(totalFacturado), 170, yPosition + 18, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.text('Total Cobrado:', 105, yPosition + 25)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text(formatCurrencyWithCRC(totalCobrado), 170, yPosition + 25, { align: 'right' })
  
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Pendiente:', 105, yPosition + 32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text(formatCurrencyWithCRC(totalPendiente), 170, yPosition + 32, { align: 'right' })
  
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Tasa de Cobranza:', 105, yPosition + 39)
  doc.setFont('helvetica', 'bold')
  const colorCobranza = tasaCobranza >= 80 ? [34, 197, 94] : tasaCobranza >= 50 ? [234, 179, 8] : [239, 68, 68]
  doc.setTextColor(...colorCobranza as [number, number, number])
  doc.text(`${tasaCobranza.toFixed(1)}%`, 170, yPosition + 39, { align: 'right' })
  
  yPosition += 60

  // ========== DETALLE DE FACTURAS ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE FACTURAS', 20, yPosition)
  
  yPosition += 8

  if (facturas.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('No hay facturas en este período', 105, yPosition + 20, { align: 'center' })
  } else {
    const facturasData = facturas.map(f => [
      new Date(f.fecha_factura).toLocaleDateString('es-CR'),
      f.proyecto.substring(0, 25) + (f.proyecto.length > 25 ? '...' : ''),
      f.cliente.substring(0, 20) + (f.cliente.length > 20 ? '...' : ''),
      formatCurrencyWithCRC(f.monto_total),
      formatCurrencyWithCRC(f.monto_pagado),
      formatCurrencyWithCRC(f.monto_pendiente),
      f.estado.toUpperCase(),
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Proyecto', 'Cliente', 'Total', 'Pagado', 'Pendiente', 'Estado']],
      body: facturasData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        // Colorear estado
        if (data.column.index === 6 && data.section === 'body') {
          const estado = data.cell.text[0]
          if (estado === 'PAGADO') {
            data.cell.styles.textColor = [34, 197, 94]
            data.cell.styles.fontStyle = 'bold'
          } else if (estado === 'ABONADO') {
            data.cell.styles.textColor = [234, 179, 8]
            data.cell.styles.fontStyle = 'bold'
          } else if (estado === 'PENDIENTE') {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // ========== RESUMEN POR CLIENTE ==========
  if (facturas.length > 0) {
    // Agrupar por cliente
    const facturasPorCliente = facturas.reduce((acc, f) => {
      if (!acc[f.cliente]) {
        acc[f.cliente] = {
          total: 0,
          cobrado: 0,
          pendiente: 0,
          cantidad: 0,
        }
      }
      acc[f.cliente].total += f.monto_total
      acc[f.cliente].cobrado += f.monto_pagado
      acc[f.cliente].pendiente += f.monto_pendiente
      acc[f.cliente].cantidad += 1
      return acc
    }, {} as Record<string, { total: number; cobrado: number; pendiente: number; cantidad: number }>)

    // Verificar si hay espacio, si no, agregar nueva página
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setTextColor(...textColor)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMEN POR CLIENTE', 20, yPosition)
    
    yPosition += 8

    const clientesData = Object.entries(facturasPorCliente)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cliente, datos]) => [
        cliente,
        String(datos.cantidad),
        formatCurrencyWithCRC(datos.total),
        formatCurrencyWithCRC(datos.cobrado),
        formatCurrencyWithCRC(datos.pendiente),
        datos.total > 0 ? `${(datos.cobrado / datos.total * 100).toFixed(1)}%` : '0%',
      ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Cliente', 'Facturas', 'Total', 'Cobrado', 'Pendiente', '% Cobrado']],
      body: clientesData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
    })
  }

  // ========== PIE DE PÁGINA ==========
  const pageCount = (doc as any).internal.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 280, 190, 280)
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Granimar CR - Reporte de Facturación', 105, 285, { align: 'center' })
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' })
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CR')} a las ${new Date().toLocaleTimeString('es-CR')}`, 20, 290)
  }

  // Guardar PDF
  const periodoNombre = periodo.replace(/\s+/g, '_')
  const fileName = `Reporte_${periodoNombre}_${new Date(fechaInicio).toLocaleDateString('es-CR').replace(/\//g, '-')}_al_${new Date(fechaFin).toLocaleDateString('es-CR').replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}
