-- Fix: Corregir orden de triggers y lógica de actualización de estado

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS trigger_actualizar_estado_factura ON pagos;
DROP TRIGGER IF EXISTS trigger_actualizar_monto_pagado ON pagos;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS actualizar_estado_factura();
DROP FUNCTION IF EXISTS actualizar_monto_pagado();

-- Crear función combinada que actualiza monto_pagado Y estado en un solo paso
CREATE OR REPLACE FUNCTION actualizar_factura_despues_pago()
RETURNS TRIGGER AS $$
DECLARE
  v_monto_pagado DECIMAL(10, 2);
  v_monto_total DECIMAL(10, 2);
BEGIN
  -- Obtener el monto total de la factura
  SELECT monto_total INTO v_monto_total
  FROM facturacion
  WHERE id = NEW.factura_id;

  -- Calcular el nuevo monto pagado
  SELECT COALESCE(SUM(monto), 0) INTO v_monto_pagado
  FROM pagos
  WHERE factura_id = NEW.factura_id;

  -- Actualizar la factura con monto_pagado y estado
  UPDATE facturacion
  SET 
    monto_pagado = v_monto_pagado,
    estado = CASE 
      WHEN v_monto_pagado >= v_monto_total THEN 'pagado'
      WHEN v_monto_pagado > 0 THEN 'abonado'
      ELSE 'pendiente'
    END,
    fecha_pago_completo = CASE 
      WHEN v_monto_pagado >= v_monto_total THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.factura_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger único que ejecuta la función combinada
CREATE TRIGGER trigger_actualizar_factura_despues_pago
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_factura_despues_pago();

-- Comentario
COMMENT ON FUNCTION actualizar_factura_despues_pago() IS 'Actualiza monto_pagado y estado de factura después de insertar un pago';
