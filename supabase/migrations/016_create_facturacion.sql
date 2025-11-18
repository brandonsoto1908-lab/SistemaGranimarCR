-- Tabla para facturación y seguimiento de pagos
CREATE TABLE IF NOT EXISTS facturacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retiro_id UUID REFERENCES retiros(id) ON DELETE CASCADE,
  proyecto VARCHAR(255) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  
  -- Montos
  monto_total DECIMAL(10, 2) NOT NULL,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_pendiente DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, abonado, pagado
  porcentaje_pagado DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN monto_total > 0 
      THEN (monto_pagado / monto_total * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Metadata
  fecha_factura DATE NOT NULL,
  fecha_pago_completo TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para abonos/pagos parciales
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID REFERENCES facturacion(id) ON DELETE CASCADE NOT NULL,
  
  -- Información del pago
  monto DECIMAL(10, 2) NOT NULL,
  tipo_pago VARCHAR(50) DEFAULT 'efectivo', -- efectivo, transferencia, cheque, tarjeta
  referencia VARCHAR(100),
  
  -- Metadata
  fecha_pago DATE NOT NULL,
  notas TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_facturacion_retiro_id ON facturacion(retiro_id);
CREATE INDEX idx_facturacion_cliente ON facturacion(cliente);
CREATE INDEX idx_facturacion_estado ON facturacion(estado);
CREATE INDEX idx_facturacion_fecha_factura ON facturacion(fecha_factura);
CREATE INDEX idx_pagos_factura_id ON pagos(factura_id);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);

-- Función para actualizar el estado de la factura automáticamente
CREATE OR REPLACE FUNCTION actualizar_estado_factura()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facturacion
  SET 
    estado = CASE 
      WHEN monto_pagado >= monto_total THEN 'pagado'
      WHEN monto_pagado > 0 THEN 'abonado'
      ELSE 'pendiente'
    END,
    fecha_pago_completo = CASE 
      WHEN monto_pagado >= monto_total THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.factura_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente cuando se agrega un pago
CREATE TRIGGER trigger_actualizar_estado_factura
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_factura();

-- Función para actualizar monto_pagado cuando se inserta un pago
CREATE OR REPLACE FUNCTION actualizar_monto_pagado()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facturacion
  SET monto_pagado = (
    SELECT COALESCE(SUM(monto), 0)
    FROM pagos
    WHERE factura_id = NEW.factura_id
  )
  WHERE id = NEW.factura_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar monto_pagado
CREATE TRIGGER trigger_actualizar_monto_pagado
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_monto_pagado();

-- Comentarios
COMMENT ON TABLE facturacion IS 'Gestión de facturación y cobros por proyecto';
COMMENT ON TABLE pagos IS 'Registro de pagos y abonos parciales a facturas';
COMMENT ON COLUMN facturacion.estado IS 'Estado del pago: pendiente (sin pagos), abonado (pago parcial), pagado (100%)';
