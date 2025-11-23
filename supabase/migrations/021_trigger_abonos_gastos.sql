-- Función para registrar abono como gasto automáticamente
CREATE OR REPLACE FUNCTION registrar_abono_como_gasto()
RETURNS TRIGGER AS $$
DECLARE
  v_prestamo RECORD;
BEGIN
  -- Obtener información del préstamo
  SELECT 
    concepto,
    acreedor,
    moneda,
    registrar_en_gastos
  INTO v_prestamo
  FROM prestamos
  WHERE id = NEW.prestamo_id;

  -- Si el préstamo tiene activado registrar_en_gastos
  IF v_prestamo.registrar_en_gastos THEN
    -- Insertar en gastos
    INSERT INTO gastos (
      concepto,
      categoria,
      monto,
      moneda,
      es_fijo,
      fecha,
      mes,
      anio,
      notas
    ) VALUES (
      'Abono Préstamo: ' || v_prestamo.concepto,
      'Préstamos',
      NEW.monto,
      v_prestamo.moneda,
      FALSE,
      NEW.fecha_abono,
      EXTRACT(MONTH FROM NEW.fecha_abono)::INTEGER,
      EXTRACT(YEAR FROM NEW.fecha_abono)::INTEGER,
      'Abono a préstamo de ' || v_prestamo.acreedor || 
      CASE 
        WHEN NEW.notas IS NOT NULL THEN '. ' || NEW.notas
        ELSE ''
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar después de insertar un abono
CREATE TRIGGER trigger_registrar_abono_como_gasto
AFTER INSERT ON abonos_prestamos
FOR EACH ROW
EXECUTE FUNCTION registrar_abono_como_gasto();

-- Comentario
COMMENT ON FUNCTION registrar_abono_como_gasto() IS 'Registra automáticamente los abonos como gastos si el préstamo tiene activada la opción registrar_en_gastos';
