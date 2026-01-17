-- Migration: 023_add_precio_cobrado_to_retiros.sql
-- Añade la columna `precio_cobrado_total` a la tabla `retiros`

ALTER TABLE IF EXISTS retiros
ADD COLUMN IF NOT EXISTS precio_cobrado_total numeric;

COMMENT ON COLUMN retiros.precio_cobrado_total IS 'Total cobrado por el retiro; permite override del precio de venta calculado';
