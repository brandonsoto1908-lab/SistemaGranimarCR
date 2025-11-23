-- Agregar columna moneda a la tabla prestamos
ALTER TABLE prestamos 
ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'CRC' CHECK (moneda IN ('CRC', 'USD'));

-- Actualizar registros existentes con moneda por defecto
UPDATE prestamos 
SET moneda = 'CRC'
WHERE moneda IS NULL;

-- Hacer la columna NOT NULL después de poblar
ALTER TABLE prestamos 
ALTER COLUMN moneda SET NOT NULL;

-- Agregar columna moneda a la tabla abonos_prestamos
ALTER TABLE abonos_prestamos 
ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'CRC' CHECK (moneda IN ('CRC', 'USD'));

-- Actualizar registros existentes con moneda por defecto
UPDATE abonos_prestamos 
SET moneda = 'CRC'
WHERE moneda IS NULL;

-- Hacer la columna NOT NULL después de poblar
ALTER TABLE abonos_prestamos 
ALTER COLUMN moneda SET NOT NULL;

-- Agregar columna para registrar abonos como gastos
ALTER TABLE prestamos 
ADD COLUMN IF NOT EXISTS registrar_en_gastos BOOLEAN DEFAULT FALSE;

-- Comentarios
COMMENT ON COLUMN prestamos.moneda IS 'Moneda del préstamo: CRC (Colones) o USD (Dólares)';
COMMENT ON COLUMN abonos_prestamos.moneda IS 'Moneda del abono: CRC (Colones) o USD (Dólares)';
COMMENT ON COLUMN prestamos.registrar_en_gastos IS 'Si es true, los abonos se registran automáticamente como gastos';
