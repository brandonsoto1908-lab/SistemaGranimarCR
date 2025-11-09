-- Migración para actualizar las tablas retiros y sobros

-- =====================================================
-- TABLA: retiros - Actualización de campos
-- =====================================================

-- Eliminar la tabla retiros actual y recrearla con los campos correctos
DROP TABLE IF EXISTS public.retiros CASCADE;

CREATE TABLE public.retiros (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  material_id uuid NOT NULL,
  
  -- Tipo de retiro
  tipo_retiro VARCHAR(20) NOT NULL CHECK (tipo_retiro IN ('laminas_completas', 'metros_lineales')),
  
  -- Cantidades
  cantidad_laminas INTEGER DEFAULT 0 CHECK (cantidad_laminas >= 0),
  metros_lineales NUMERIC(10,2) DEFAULT 0 CHECK (metros_lineales >= 0),
  
  -- Información del proyecto
  proyecto VARCHAR(255) NOT NULL,
  cliente VARCHAR(255),
  usuario VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  -- Precios y costos
  costo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_venta_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  ganancia NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Flags
  uso_sobrantes BOOLEAN DEFAULT false,
  
  -- Fechas
  fecha_retiro TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT retiros_pkey PRIMARY KEY (id),
  CONSTRAINT retiros_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materiales(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_retiros_material ON retiros(material_id);
CREATE INDEX idx_retiros_fecha ON retiros(fecha_retiro);
CREATE INDEX idx_retiros_proyecto ON retiros(proyecto);
CREATE INDEX idx_retiros_tipo ON retiros(tipo_retiro);

-- =====================================================
-- TABLA: sobros - Actualización para agregar campos útiles
-- =====================================================

-- Agregar campos adicionales a sobros si no existen
ALTER TABLE public.sobros 
  ADD COLUMN IF NOT EXISTS retiro_origen_id uuid REFERENCES public.retiros(id),
  ADD COLUMN IF NOT EXISTS proyecto_origen VARCHAR(255),
  ADD COLUMN IF NOT EXISTS usado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_uso TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS notas TEXT;

CREATE INDEX IF NOT EXISTS idx_sobros_material ON sobros(material_id);
CREATE INDEX IF NOT EXISTS idx_sobros_usado ON sobros(usado);

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE sobros ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (ajustar según necesidades de seguridad)
DROP POLICY IF EXISTS "Enable read access for all users" ON retiros;
CREATE POLICY "Enable read access for all users" ON retiros FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON retiros;
CREATE POLICY "Enable insert for all users" ON retiros FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON retiros;
CREATE POLICY "Enable update for all users" ON retiros FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON retiros;
CREATE POLICY "Enable delete for all users" ON retiros FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON sobros;
CREATE POLICY "Enable read access for all users" ON sobros FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON sobros;
CREATE POLICY "Enable insert for all users" ON sobros FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON sobros;
CREATE POLICY "Enable update for all users" ON sobros FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON sobros;
CREATE POLICY "Enable delete for all users" ON sobros FOR DELETE USING (true);

-- =====================================================
-- Funciones auxiliares
-- =====================================================

-- Función para obtener el total de metros lineales disponibles en sobros por material
CREATE OR REPLACE FUNCTION get_sobros_metros_lineales(p_material_id uuid)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(metros_lineales) 
     FROM sobros 
     WHERE material_id = p_material_id AND usado = false),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener la cantidad de piezas de sobros por material
CREATE OR REPLACE FUNCTION get_sobros_count(p_material_id uuid)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT COUNT(*) 
     FROM sobros 
     WHERE material_id = p_material_id AND usado = false),
    0
  );
END;
$$ LANGUAGE plpgsql;
