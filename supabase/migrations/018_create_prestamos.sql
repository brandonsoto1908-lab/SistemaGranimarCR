-- Tabla para préstamos
CREATE TABLE IF NOT EXISTS prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto VARCHAR(255) NOT NULL,
  acreedor VARCHAR(255) NOT NULL, -- Persona o institución que prestó
  monto_total DECIMAL(10, 2) NOT NULL,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_pendiente DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
  
  -- Detalles del préstamo
  tasa_interes DECIMAL(5, 2) DEFAULT 0, -- Porcentaje de interés
  plazo_meses INTEGER, -- Plazo en meses
  cuota_mensual DECIMAL(10, 2), -- Cuota mensual si aplica
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- activo, pagado, vencido
  porcentaje_pagado DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN monto_total > 0 
      THEN (monto_pagado / monto_total * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Fechas
  fecha_prestamo DATE NOT NULL,
  fecha_vencimiento DATE,
  fecha_pago_completo TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notas TEXT,
  categoria VARCHAR(100), -- Personal, Empresarial, Bancario, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para abonos a préstamos
CREATE TABLE IF NOT EXISTS abonos_prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE NOT NULL,
  
  -- Información del abono
  monto DECIMAL(10, 2) NOT NULL,
  monto_capital DECIMAL(10, 2) NOT NULL, -- Parte que va a capital
  monto_interes DECIMAL(10, 2) DEFAULT 0, -- Parte que va a intereses
  tipo_pago VARCHAR(50) DEFAULT 'efectivo', -- efectivo, transferencia, cheque
  referencia VARCHAR(100),
  
  -- Metadata
  fecha_abono DATE NOT NULL,
  notas TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_prestamos_acreedor ON prestamos(acreedor);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_prestamos_fecha_prestamo ON prestamos(fecha_prestamo);
CREATE INDEX idx_abonos_prestamos_prestamo_id ON abonos_prestamos(prestamo_id);
CREATE INDEX idx_abonos_prestamos_fecha_abono ON abonos_prestamos(fecha_abono);

-- Función para actualizar préstamo después de abono
CREATE OR REPLACE FUNCTION actualizar_prestamo_despues_abono()
RETURNS TRIGGER AS $$
DECLARE
  v_monto_pagado DECIMAL(10, 2);
  v_monto_total DECIMAL(10, 2);
BEGIN
  -- Obtener el monto total del préstamo
  SELECT monto_total INTO v_monto_total
  FROM prestamos
  WHERE id = NEW.prestamo_id;

  -- Calcular el nuevo monto pagado (solo capital)
  SELECT COALESCE(SUM(monto_capital), 0) INTO v_monto_pagado
  FROM abonos_prestamos
  WHERE prestamo_id = NEW.prestamo_id;

  -- Actualizar el préstamo
  UPDATE prestamos
  SET 
    monto_pagado = v_monto_pagado,
    estado = CASE 
      WHEN v_monto_pagado >= v_monto_total THEN 'pagado'
      WHEN v_monto_pagado > 0 THEN 'activo'
      ELSE 'activo'
    END,
    fecha_pago_completo = CASE 
      WHEN v_monto_pagado >= v_monto_total THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.prestamo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar préstamo después de abono
CREATE TRIGGER trigger_actualizar_prestamo_despues_abono
AFTER INSERT ON abonos_prestamos
FOR EACH ROW
EXECUTE FUNCTION actualizar_prestamo_despues_abono();

-- Comentarios
COMMENT ON TABLE prestamos IS 'Gestión de préstamos recibidos';
COMMENT ON TABLE abonos_prestamos IS 'Registro de abonos y pagos a préstamos';
COMMENT ON COLUMN prestamos.estado IS 'Estado del préstamo: activo (con saldo), pagado (completamente), vencido (fecha vencida)';
COMMENT ON COLUMN abonos_prestamos.monto_capital IS 'Monto que se aplica al capital del préstamo';
COMMENT ON COLUMN abonos_prestamos.monto_interes IS 'Monto que se paga de intereses';
