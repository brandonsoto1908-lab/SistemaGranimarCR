-- Migration: 024_add_material_to_facturacion.sql
-- Añade columnas para registrar el material y la cantidad usada al crear una factura desde un retiro

ALTER TABLE IF EXISTS facturacion
ADD COLUMN IF NOT EXISTS tipo_material VARCHAR(255);

ALTER TABLE IF EXISTS facturacion
ADD COLUMN IF NOT EXISTS cantidad_material numeric;

ALTER TABLE IF EXISTS facturacion
ADD COLUMN IF NOT EXISTS unidad_material VARCHAR(50);

COMMENT ON COLUMN facturacion.tipo_material IS 'Nombre o tipo de material usado en el retiro asociado a la factura';
COMMENT ON COLUMN facturacion.cantidad_material IS 'Cantidad de material usada (ej. número de láminas o metros)';
COMMENT ON COLUMN facturacion.unidad_material IS 'Unidad de medida de la cantidad (ej. láminas, m)';
