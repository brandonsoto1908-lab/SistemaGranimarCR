-- Migration: 026_add_numero_factura_to_facturacion.sql
-- Añade columna `numero_factura` a la tabla `facturacion` para permitir números personalizados de factura

ALTER TABLE IF EXISTS facturacion
ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(100);

COMMENT ON COLUMN facturacion.numero_factura IS 'Número de factura personalizado asignado al registro (puede ser NULL)';
