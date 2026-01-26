-- Migration: 025_add_material_to_retiros.sql
-- Añade columnas para registrar el material y la cantidad usada en la tabla `retiros`

ALTER TABLE IF EXISTS retiros
ADD COLUMN IF NOT EXISTS tipo_material VARCHAR(255);

ALTER TABLE IF EXISTS retiros
ADD COLUMN IF NOT EXISTS cantidad_material numeric;

ALTER TABLE IF EXISTS retiros
ADD COLUMN IF NOT EXISTS unidad_material VARCHAR(50);

COMMENT ON COLUMN retiros.tipo_material IS 'Nombre o tipo de material usado en el retiro';
COMMENT ON COLUMN retiros.cantidad_material IS 'Cantidad de material usada (ej. número de láminas o metros)';
COMMENT ON COLUMN retiros.unidad_material IS 'Unidad de medida de la cantidad (ej. láminas, m)';
