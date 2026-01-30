-- Agregar columnas saldo_debito y poliza a abonos_prestamos
ALTER TABLE abonos_prestamos
  ADD COLUMN IF NOT EXISTS saldo_debito DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS poliza DECIMAL(10,2);

COMMENT ON COLUMN abonos_prestamos.saldo_debito IS 'Saldo de débito asociado al abono (opcional)';
COMMENT ON COLUMN abonos_prestamos.poliza IS 'Monto de póliza asociado al abono (opcional)';
