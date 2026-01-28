-- Migration: 029_add_usd_to_crc_rate_to_facturacion.sql
-- Añade columna `usd_to_crc_rate` a la tabla `facturacion` para almacenar la tasa usada por factura.
-- Ejecutar en Supabase SQL editor o con psql. Hacer backup antes de ejecutar.

BEGIN;

ALTER TABLE IF EXISTS facturacion ADD COLUMN IF NOT EXISTS usd_to_crc_rate numeric;

COMMIT;

-- Opcional: backfill usando exchangerate.host (no incluido por seguridad).