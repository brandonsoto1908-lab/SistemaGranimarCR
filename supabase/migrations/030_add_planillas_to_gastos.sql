-- Migration: 030_add_planillas_to_gastos.sql
-- Añade soporte para planillas en la tabla `gastos`.
-- Agrega columnas: is_planilla, frecuencia_pago, proxima_fecha_pago
-- Ejecutar en Supabase SQL editor o con psql. Hacer backup antes de ejecutar.

BEGIN;

ALTER TABLE IF EXISTS gastos
  ADD COLUMN IF NOT EXISTS is_planilla boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frecuencia_pago text,
  ADD COLUMN IF NOT EXISTS proxima_fecha_pago date;

COMMIT;

-- NOTA: frecuencia_pago es texto para mantener compatibilidad; se puede
-- convertir a enum si se desea control más estricto.