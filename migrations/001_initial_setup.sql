-- =====================================================
-- MIGRACIÓN COMPLETA DE BASE DE DATOS - GRANIMAR CR
-- Sistema de Gestión de Producción e Inventario
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: proveedores
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);

-- =====================================================
-- TABLA: materiales
-- =====================================================
CREATE TABLE IF NOT EXISTS materiales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  unidad_medida VARCHAR(50),
  cantidad_actual DECIMAL(10,2) DEFAULT 0,
  cantidad_minima DECIMAL(10,2),
  precio_unitario DECIMAL(10,2),
  proveedor_id UUID REFERENCES proveedores(id),
  ubicacion_fisica VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_materiales_categoria ON materiales(categoria);
CREATE INDEX idx_materiales_nombre ON materiales(nombre);
CREATE INDEX idx_materiales_proveedor ON materiales(proveedor_id);

-- =====================================================
-- TABLA: materiales_movimientos
-- =====================================================
CREATE TABLE IF NOT EXISTS materiales_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materiales(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2),
  motivo VARCHAR(255),
  referencia VARCHAR(100),
  usuario VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_movimientos_material ON materiales_movimientos(material_id);
CREATE INDEX idx_movimientos_fecha ON materiales_movimientos(created_at);
CREATE INDEX idx_movimientos_tipo ON materiales_movimientos(tipo_movimiento);

-- =====================================================
-- TABLA: discos (Herramientas y Consumibles)
-- =====================================================
CREATE TABLE IF NOT EXISTS discos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  material_compatible VARCHAR(100),
  cantidad INTEGER DEFAULT 0,
  marca VARCHAR(100),
  diametro DECIMAL(10,2),
  espesor DECIMAL(10,2),
  descripcion_detallada TEXT,
  ubicacion_fisica VARCHAR(255),
  notas TEXT,
  imagenes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discos_tipo ON discos(tipo);
CREATE INDEX idx_discos_material ON discos(material_compatible);
CREATE INDEX idx_discos_nombre ON discos(nombre);

-- =====================================================
-- TABLA: discos_movimientos
-- =====================================================
CREATE TABLE IF NOT EXISTS discos_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disco_id UUID REFERENCES discos(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'uso')),
  cantidad INTEGER NOT NULL,
  motivo VARCHAR(255),
  proyecto VARCHAR(255),
  usuario VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discos_movimientos_disco ON discos_movimientos(disco_id);
CREATE INDEX idx_discos_movimientos_fecha ON discos_movimientos(created_at);

-- =====================================================
-- TABLA: gastos
-- =====================================================
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  monto DECIMAL(10,2) NOT NULL,
  es_fijo BOOLEAN DEFAULT FALSE,
  fecha DATE NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_gastos_mes_anio ON gastos(mes, anio);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
CREATE INDEX idx_gastos_es_fijo ON gastos(es_fijo);

-- =====================================================
-- TABLA: produccion
-- =====================================================
CREATE TABLE IF NOT EXISTS produccion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_sobre VARCHAR(100) NOT NULL UNIQUE,
  cliente VARCHAR(255) NOT NULL,
  tipo_material VARCHAR(100),
  metros_lineales DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha_produccion DATE NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  costo_materiales DECIMAL(10,2) DEFAULT 0,
  costo_mano_obra DECIMAL(10,2) DEFAULT 0,
  costo_fijo_asignado DECIMAL(10,2) DEFAULT 0,
  costo_total DECIMAL(10,2) GENERATED ALWAYS AS (
    costo_materiales + costo_mano_obra + costo_fijo_asignado
  ) STORED,
  estado VARCHAR(50) DEFAULT 'en_proceso' CHECK (estado IN ('en_proceso', 'completado', 'entregado', 'cancelado')),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_produccion_codigo ON produccion(codigo_sobre);
CREATE INDEX idx_produccion_fecha ON produccion(fecha_produccion);
CREATE INDEX idx_produccion_mes_anio ON produccion(mes, anio);
CREATE INDEX idx_produccion_cliente ON produccion(cliente);
CREATE INDEX idx_produccion_estado ON produccion(estado);

-- =====================================================
-- TABLA: retiros (Retiros de Inventario)
-- =====================================================
CREATE TABLE IF NOT EXISTS retiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materiales(id) ON DELETE CASCADE,
  cantidad DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(255),
  proyecto VARCHAR(255),
  fecha_retiro TIMESTAMP DEFAULT NOW(),
  usuario VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retiros_material ON retiros(material_id);
CREATE INDEX idx_retiros_fecha ON retiros(fecha_retiro);

-- =====================================================
-- FUNCIÓN RPC: Calcular Costo Fijo por Metro
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_costo_fijo_por_metro(
  p_year INTEGER,
  p_month INTEGER,
  p_metros_lineales DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  total_gastos_fijos DECIMAL;
  total_metros_mes DECIMAL;
  costo_por_metro DECIMAL;
  metros_minimos CONSTANT DECIMAL := 30.0;
BEGIN
  -- Obtener total de gastos fijos del mes
  SELECT COALESCE(SUM(monto), 0) INTO total_gastos_fijos
  FROM gastos
  WHERE anio = p_year 
    AND mes = p_month 
    AND es_fijo = TRUE;
  
  -- Obtener total de metros lineales producidos en el mes
  SELECT COALESCE(SUM(metros_lineales), 0) INTO total_metros_mes
  FROM produccion
  WHERE anio = p_year 
    AND mes = p_month;
  
  -- Si no hay metros producidos, usar el mínimo
  IF total_metros_mes < metros_minimos THEN
    total_metros_mes := metros_minimos;
  END IF;
  
  -- Calcular costo por metro
  IF total_metros_mes > 0 THEN
    costo_por_metro := total_gastos_fijos / total_metros_mes;
  ELSE
    costo_por_metro := 0;
  END IF;
  
  -- Retornar costo para los metros especificados
  RETURN ROUND(costo_por_metro * p_metros_lineales, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN RPC: Totales de Gastos Fijos y Producción
-- =====================================================
CREATE OR REPLACE FUNCTION totales_fijos_produccion(p_year INTEGER, p_month INTEGER)
RETURNS TABLE(
  total_gastos_fijos DECIMAL,
  total_metros_producidos DECIMAL,
  costo_por_metro DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(g.monto), 0) as total_gastos_fijos,
    COALESCE(SUM(p.metros_lineales), 0) as total_metros_producidos,
    CASE 
      WHEN COALESCE(SUM(p.metros_lineales), 0) > 0 
      THEN ROUND(COALESCE(SUM(g.monto), 0) / COALESCE(SUM(p.metros_lineales), 0), 2)
      ELSE 0
    END as costo_por_metro
  FROM gastos g
  FULL OUTER JOIN produccion p ON g.anio = p.anio AND g.mes = p.mes
  WHERE g.anio = p_year 
    AND g.mes = p_month 
    AND g.es_fijo = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Actualizar updated_at en materiales
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materiales_updated_at
BEFORE UPDATE ON materiales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discos_updated_at
BEFORE UPDATE ON discos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produccion_updated_at
BEFORE UPDATE ON produccion
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discos_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiros ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - Permitir todas las operaciones a usuarios autenticados
-- =====================================================

-- Materiales
CREATE POLICY "Permitir todo en materiales" ON materiales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura pública en materiales" ON materiales FOR SELECT TO anon USING (true);

-- Materiales Movimientos
CREATE POLICY "Permitir todo en materiales_movimientos" ON materiales_movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Discos
CREATE POLICY "Permitir todo en discos" ON discos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura pública en discos" ON discos FOR SELECT TO anon USING (true);

-- Discos Movimientos
CREATE POLICY "Permitir todo en discos_movimientos" ON discos_movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Proveedores
CREATE POLICY "Permitir todo en proveedores" ON proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Gastos
CREATE POLICY "Permitir todo en gastos" ON gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Producción
CREATE POLICY "Permitir todo en produccion" ON produccion FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Retiros
CREATE POLICY "Permitir todo en retiros" ON retiros FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- DATOS DE EJEMPLO (Opcional - comentar si no se desea)
-- =====================================================

-- Proveedores de ejemplo
INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
  ('Distribuidora Piedras CR', 'Juan Pérez', '22334455', 'ventas@piedrascr.com'),
  ('Herramientas Industriales SA', 'María González', '88776655', 'info@herramientas.co.cr')
ON CONFLICT DO NOTHING;

-- Categorías comunes de materiales
-- (Los materiales se agregarán desde la aplicación)

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
