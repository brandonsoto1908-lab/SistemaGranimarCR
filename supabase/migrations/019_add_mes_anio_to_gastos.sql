-- Agregar columnas faltantes a la tabla gastos para alinear con el código
ALTER TABLE gastos 
ADD COLUMN IF NOT EXISTS concepto VARCHAR(255),
ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedores(id),
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS mes INTEGER,
ADD COLUMN IF NOT EXISTS anio INTEGER,
ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'CRC' CHECK (moneda IN ('CRC', 'USD'));

-- Actualizar columnas nuevas con datos de fecha
UPDATE gastos 
SET 
  mes = EXTRACT(MONTH FROM fecha)::INTEGER,
  anio = EXTRACT(YEAR FROM fecha)::INTEGER
WHERE mes IS NULL OR anio IS NULL;

-- Hacer las columnas NOT NULL después de poblarlas
ALTER TABLE gastos 
ALTER COLUMN mes SET NOT NULL,
ALTER COLUMN anio SET NOT NULL,
ALTER COLUMN moneda SET NOT NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_mes_anio ON gastos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_gastos_proveedor_id ON gastos(proveedor_id);

-- Comentarios
COMMENT ON COLUMN gastos.concepto IS 'Descripción del gasto';
COMMENT ON COLUMN gastos.mes IS 'Mes del gasto (1-12)';
COMMENT ON COLUMN gastos.anio IS 'Año del gasto';
COMMENT ON COLUMN gastos.moneda IS 'Moneda del gasto: CRC (Colones) o USD (Dólares)';
