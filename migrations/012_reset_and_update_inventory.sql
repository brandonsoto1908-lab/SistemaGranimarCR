-- =====================================================
-- RESETEAR Y ACTUALIZAR INVENTARIO
-- =====================================================
-- Este script resetea el inventario a 0 y luego inyecta
-- las cantidades correctas de materiales y sobrantes

-- =====================================================
-- PASO 1: RESETEAR TODO A 0
-- =====================================================

-- Resetear cantidades de materiales
UPDATE public.materiales
SET cantidad_laminas = 0;

-- Eliminar todos los sobrantes existentes (tabla sobros)
DELETE FROM public.sobros;

-- =====================================================
-- PASO 2: AGREGAR CAMPOS DE DIMENSIONES A RETIROS
-- =====================================================

-- Agregar largo y ancho para trabajar en metros cuadrados
ALTER TABLE public.retiros 
ADD COLUMN IF NOT EXISTS largo_metros DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ancho_metros DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS metros_cuadrados DECIMAL(10,2) GENERATED ALWAYS AS (largo_metros * ancho_metros) STORED;

-- Comentarios para documentar
COMMENT ON COLUMN public.retiros.largo_metros IS 'Largo del retiro en metros';
COMMENT ON COLUMN public.retiros.ancho_metros IS 'Ancho del retiro en metros';
COMMENT ON COLUMN public.retiros.metros_cuadrados IS 'Área total del retiro en metros cuadrados (calculado)';

-- =====================================================
-- PASO 3: ACTUALIZAR/INSERTAR MATERIALES
-- =====================================================

-- Actualizar materiales existentes o insertar nuevos
DO $$
DECLARE
  material_id UUID;
BEGIN
  -- Calacatta Rojo
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Calacatta Rojo';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 20 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Calacatta Rojo', 20, 0, 0, 0, 0);
  END IF;

  -- Calacatta Gris
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Calacatta Gris';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 20 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Calacatta Gris', 20, 0, 0, 0, 0);
  END IF;

  -- Calacatta Gold
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Calacatta Gold';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 13 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Calacatta Gold', 13, 0, 0, 0, 0);
  END IF;

  -- Negro Marquina
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Negro Marquina';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 6 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Negro Marquina', 6, 0, 0, 0, 0);
  END IF;

  -- Chispa Beige
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Chispa Beige';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 22 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Chispa Beige', 22, 0, 0, 0, 0);
  END IF;

  -- Blanco Estelar
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Blanco Estelar';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 35 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Blanco Estelar', 35, 0, 0, 0, 0);
  END IF;

  -- Chispa Fina
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Chispa Fina';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 40 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Chispa Fina', 40, 0, 0, 0, 0);
  END IF;

  -- Negro Estelar
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Negro Estelar';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 26 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Negro Estelar', 26, 0, 0, 0, 0);
  END IF;

  -- Blanco Puro
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Blanco Puro';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 34 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Blanco Puro', 34, 0, 0, 0, 0);
  END IF;

  -- Carrara
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Carrara';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 9 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Carrara', 9, 0, 0, 0, 0);
  END IF;

  -- Gris Estelar (NUEVO)
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Gris Estelar';
  IF material_id IS NOT NULL THEN
    UPDATE public.materiales SET cantidad_laminas = 17 WHERE id = material_id;
  ELSE
    INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
    VALUES ('Gris Estelar', 17, 0, 0, 0, 0);
  END IF;
END $$;

-- =====================================================
-- PASO 4: INSERTAR SOBRANTES EN METROS CUADRADOS
-- =====================================================

-- Insertar sobrantes para materiales específicos
-- Los sobrantes se almacenan en la tabla "sobros" (metros cuadrados)

DO $$
DECLARE
  material_id UUID;
BEGIN
  -- Calacatta Gris: 8.52 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Calacatta Gris';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 8.52, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Calacatta Gold: 7.27 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Calacatta Gold';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 7.27, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Chispa Beige: 2 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Chispa Beige';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 2.00, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Blanco Estelar: 3.96 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Blanco Estelar';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 3.96, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Negro Estelar: 5.63 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Negro Estelar';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 5.63, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Carrara: 1.71 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Carrara';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 1.71, 'Inventario inicial', 'metros cuadrados');
  END IF;

  -- Gris Estelar: 2.88 m²
  SELECT id INTO material_id FROM public.materiales WHERE nombre = 'Gris Estelar';
  IF material_id IS NOT NULL THEN
    INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas)
    VALUES (material_id, 2.88, 'Inventario inicial', 'metros cuadrados');
  END IF;
END $$;

-- =====================================================
-- PASO 5: VERIFICACIÓN
-- =====================================================

-- Verificar materiales con sus cantidades
SELECT 
  nombre,
  cantidad_laminas,
  COALESCE(
    (SELECT SUM(metros_lineales) 
     FROM sobros 
     WHERE material_id = materiales.id 
     AND usado = false),
    0
  ) as sobrantes_m2
FROM public.materiales
ORDER BY nombre;

-- Resumen de sobrantes
SELECT 
  m.nombre,
  COUNT(s.id) as cantidad_sobrantes,
  SUM(s.metros_lineales) as total_m2
FROM public.materiales m
LEFT JOIN public.sobros s ON s.material_id = m.id AND s.usado = false
GROUP BY m.nombre
HAVING SUM(s.metros_lineales) > 0
ORDER BY m.nombre;
