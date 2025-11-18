-- Tabla para costeo de producción
CREATE TABLE IF NOT EXISTS costeo_produccion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retiro_id UUID REFERENCES retiros(id) ON DELETE CASCADE,
  proyecto VARCHAR(255) NOT NULL,
  
  -- Costos
  costo_material DECIMAL(10, 2) DEFAULT 0,
  costo_mano_obra DECIMAL(10, 2) DEFAULT 0,
  costo_insumos DECIMAL(10, 2) DEFAULT 0,
  
  -- Horas de trabajo
  horas_trabajadas DECIMAL(10, 2) DEFAULT 0,
  tarifa_hora DECIMAL(10, 2) DEFAULT 0,
  
  -- Insumos utilizados
  insumos_detalle JSONB DEFAULT '[]'::jsonb,
  
  -- Totales
  costo_total DECIMAL(10, 2) GENERATED ALWAYS AS (
    costo_material + costo_mano_obra + costo_insumos
  ) STORED,
  
  -- Precio de venta y ganancia
  precio_venta DECIMAL(10, 2) DEFAULT 0,
  ganancia_total DECIMAL(10, 2) GENERATED ALWAYS AS (
    precio_venta - (costo_material + costo_mano_obra + costo_insumos)
  ) STORED,
  
  -- Porcentajes configurables
  porcentaje_material DECIMAL(5, 2) DEFAULT 15.00,
  porcentaje_mano_obra DECIMAL(5, 2) DEFAULT 20.00,
  porcentaje_insumos DECIMAL(5, 2) DEFAULT 0.50,
  porcentaje_ahorros DECIMAL(5, 2) DEFAULT 50.00,
  porcentaje_ganancia DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN precio_venta > 0 
      THEN ((precio_venta - (costo_material + costo_mano_obra + costo_insumos)) / precio_venta * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registro de insumos
CREATE TABLE IF NOT EXISTS insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(50) DEFAULT 'unidad',
  precio_unitario DECIMAL(10, 2) DEFAULT 0,
  stock_actual DECIMAL(10, 2) DEFAULT 0,
  stock_minimo DECIMAL(10, 2) DEFAULT 0,
  categoria VARCHAR(100),
  proveedor VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_costeo_produccion_retiro_id ON costeo_produccion(retiro_id);
CREATE INDEX idx_costeo_produccion_proyecto ON costeo_produccion(proyecto);
CREATE INDEX idx_costeo_produccion_created_at ON costeo_produccion(created_at);
CREATE INDEX idx_insumos_nombre ON insumos(nombre);
CREATE INDEX idx_insumos_categoria ON insumos(categoria);

-- Comentarios
COMMENT ON TABLE costeo_produccion IS 'Tabla para gestionar el costeo detallado de cada proyecto/retiro';
COMMENT ON TABLE insumos IS 'Catálogo de insumos utilizados en producción';
COMMENT ON COLUMN costeo_produccion.insumos_detalle IS 'Array JSON con detalle de insumos: [{"insumo_id": "uuid", "nombre": "string", "cantidad": number, "precio_unitario": number, "subtotal": number}]';
