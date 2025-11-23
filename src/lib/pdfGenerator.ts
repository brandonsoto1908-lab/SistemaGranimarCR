// @ts-nocheck
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Factura {
  id: string
  proyecto: string
  cliente: string
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  estado: string
  porcentaje_pagado: number
  fecha_factura: string
  fecha_pago_completo: string | null
  notas: string
}

interface Pago {
  id: string
  monto: number
  tipo_pago: string
  referencia: string
  fecha_pago: string
  notas: string
}

export const generarPDFFactura = (factura: Factura, pagos: Pago[]) => {
  const doc = new jsPDF()
  
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
  doc.setFont('helvetica', 'bold')
  doc.text('GRANIMAR CR', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión de Producción', 20, 27)
  
  // Información de la empresa (derecha)
  doc.setFontSize(8)
  doc.text('Tel: +506 XXXX-XXXX', 150, 15, { align: 'left' })
  doc.text('info@granimarcr.com', 150, 20, { align: 'left' })
  doc.text('San José, Costa Rica', 150, 25, { align: 'left' })
  
  yPosition = 45

  // ========== TÍTULO DE FACTURA ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA', 105, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. ${factura.id.slice(0, 8).toUpperCase()}`, 105, yPosition, { align: 'center' })
  
  yPosition += 15

  // ========== INFORMACIÓN DEL CLIENTE Y PROYECTO ==========
  // Marco izquierdo - Cliente
  doc.setFillColor(...lightGray)
  doc.rect(20, yPosition, 85, 35, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(20, yPosition, 85, 35, 'S')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...textColor)
  doc.text('INFORMACIÓN DEL CLIENTE', 25, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Cliente:', 25, yPosition + 15)
  doc.setFont('helvetica', 'bold')
  doc.text(factura.cliente, 25, yPosition + 20)
  
  doc.setFont('helvetica', 'normal')
  doc.text('Proyecto:', 25, yPosition + 26)
  doc.setFont('helvetica', 'bold')
  doc.text(factura.proyecto, 25, yPosition + 31)
  
  // Marco derecho - Fechas
  doc.setFillColor(...lightGray)
  doc.rect(110, yPosition, 80, 35, 'F')
  doc.rect(110, yPosition, 80, 35, 'S')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('INFORMACIÓN DE PAGO', 115, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Fecha Factura:', 115, yPosition + 15)
  doc.setFont('helvetica', 'bold')
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
  doc.setFont('helvetica', 'bold')
  doc.text(`ESTADO: ${estadoInfo.text} (${factura.porcentaje_pagado.toFixed(2)}%)`, 105, yPosition + 7, { align: 'center' })
  
  yPosition += 18

  // ========== RESUMEN DE MONTOS ==========
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN DE MONTOS', 20, yPosition)
  
  yPosition += 8

  // Tabla de montos
  const montosData = [
    ['Monto Total', formatCurrency(factura.monto_total)],
    ['Monto Pagado', formatCurrency(factura.monto_pagado)],
    ['Monto Pendiente', formatCurrency(factura.monto_pendiente)],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Concepto', 'Monto']],
    body: montosData,
    theme: 'grid',
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
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
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
      formatCurrency(pago.monto),
      pago.tipo_pago,
      pago.referencia || '-',
      pago.notas || '-',
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Monto', 'Método', 'Referencia', 'Notas']],
      body: pagosData,
      theme: 'striped',
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
        0: { cellWidth: 25 },
        1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 50 },
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

// Función auxiliar para formatear moneda
const formatCurrency = (value: number): string => {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

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
  doc.text(formatCurrency(totalFacturado), 170, yPosition + 18, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.text('Total Cobrado:', 105, yPosition + 25)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text(formatCurrency(totalCobrado), 170, yPosition + 25, { align: 'right' })
  
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Pendiente:', 105, yPosition + 32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text(formatCurrency(totalPendiente), 170, yPosition + 32, { align: 'right' })
  
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
      formatCurrency(f.monto_total),
      formatCurrency(f.monto_pagado),
      formatCurrency(f.monto_pendiente),
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
        formatCurrency(datos.total),
        formatCurrency(datos.cobrado),
        formatCurrency(datos.pendiente),
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
