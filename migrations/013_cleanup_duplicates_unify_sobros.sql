-- =====================================================
-- LIMPIAR DUPLICADOS Y UNIFICAR SOBRANTES
-- =====================================================
-- Este script elimina materiales duplicados y unifica
-- los sobrantes en un solo registro general por material

-- =====================================================
-- PASO 1: IDENTIFICAR Y ELIMINAR DUPLICADOS
-- =====================================================

-- Eliminar duplicados manteniendo el que tiene imagen o precios configurados
DO $$
DECLARE
  rec RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  -- Para cada nombre de material que tenga duplicados
  FOR rec IN 
    SELECT nombre, COUNT(*) as count
    FROM public.materiales
    GROUP BY nombre
    HAVING COUNT(*) > 1
  LOOP
    -- Seleccionar el ID a mantener (el que tenga imagen_url o precios > 0)
    SELECT id INTO keep_id
    FROM public.materiales
    WHERE nombre = rec.nombre
    ORDER BY 
      CASE WHEN imagen_url IS NOT NULL THEN 1 ELSE 2 END,
      CASE WHEN precio_costo > 0 OR precio_venta > 0 THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 1;
    
    -- Obtener IDs a eliminar
    SELECT ARRAY_AGG(id) INTO delete_ids
    FROM public.materiales
    WHERE nombre = rec.nombre AND id != keep_id;
    
    -- Sumar las cantidades de los duplicados al que vamos a mantener
    UPDATE public.materiales
    SET cantidad_laminas = (
      SELECT SUM(cantidad_laminas)
      FROM public.materiales
      WHERE nombre = rec.nombre
    )
    WHERE id = keep_id;
    
    -- Actualizar referencias de sobros al ID que mantenemos
    UPDATE public.sobros
    SET material_id = keep_id
    WHERE material_id = ANY(delete_ids);
    
    -- Actualizar referencias de retiros al ID que mantenemos
    UPDATE public.retiros
    SET material_id = keep_id
    WHERE material_id = ANY(delete_ids);
    
    -- Eliminar los duplicados
    DELETE FROM public.materiales
    WHERE id = ANY(delete_ids);
    
    RAISE NOTICE 'Material "%" limpiado: mantenido ID %, eliminados %', rec.nombre, keep_id, delete_ids;
  END LOOP;
END $$;

-- =====================================================
-- PASO 2: UNIFICAR SOBRANTES POR MATERIAL
-- =====================================================

-- Unificar todos los sobrantes de cada material en un solo registro
DO $$
DECLARE
  mat RECORD;
  total_sobros NUMERIC;
  sobro_id UUID;
BEGIN
  -- Para cada material que tenga sobrantes
  FOR mat IN 
    SELECT DISTINCT material_id
    FROM public.sobros
    WHERE usado = false
  LOOP
    -- Calcular total de sobrantes para este material
    SELECT SUM(metros_lineales) INTO total_sobros
    FROM public.sobros
    WHERE material_id = mat.material_id AND usado = false;
    
    -- Si hay sobrantes
    IF total_sobros > 0 THEN
      -- Verificar si ya existe un sobro unificado
      SELECT id INTO sobro_id
      FROM public.sobros
      WHERE material_id = mat.material_id 
        AND usado = false
        AND notas = 'Sobrantes generales unificados'
      LIMIT 1;
      
      -- Si existe, actualizar la cantidad
      IF sobro_id IS NOT NULL THEN
        -- Sumar todos los otros sobrantes a este
        UPDATE public.sobros
        SET metros_lineales = total_sobros,
            aprovechable = true
        WHERE id = sobro_id;
        
        -- Eliminar los demás sobrantes de este material
        DELETE FROM public.sobros
        WHERE material_id = mat.material_id 
          AND usado = false 
          AND id != sobro_id;
      ELSE
        -- Si no existe, crear uno nuevo y eliminar los demás
        INSERT INTO public.sobros (material_id, metros_lineales, proyecto_origen, notas, usado, aprovechable)
        VALUES (mat.material_id, total_sobros, 'General', 'Sobrantes generales unificados', false, true);
        
        -- Eliminar todos los sobrantes individuales
        DELETE FROM public.sobros
        WHERE material_id = mat.material_id 
          AND usado = false
          AND notas != 'Sobrantes generales unificados';
      END IF;
      
      RAISE NOTICE 'Material ID % unificado: % m² en sobrantes', mat.material_id, total_sobros;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PASO 3: ACTUALIZAR CANTIDADES DE MATERIALES
-- =====================================================

-- Actualizar las cantidades específicas que solicitaste
UPDATE public.materiales SET cantidad_laminas = 20 WHERE nombre = 'Calacatta Rojo';
UPDATE public.materiales SET cantidad_laminas = 20 WHERE nombre = 'Calacatta Gris';
UPDATE public.materiales SET cantidad_laminas = 13 WHERE nombre = 'Calacatta Gold';
UPDATE public.materiales SET cantidad_laminas = 6 WHERE nombre = 'Negro Marquina';
UPDATE public.materiales SET cantidad_laminas = 22 WHERE nombre = 'Chispa Beige';
UPDATE public.materiales SET cantidad_laminas = 35 WHERE nombre = 'Blanco Estelar';
UPDATE public.materiales SET cantidad_laminas = 40 WHERE nombre = 'Chispa Fina';
UPDATE public.materiales SET cantidad_laminas = 26 WHERE nombre = 'Negro Estelar';
UPDATE public.materiales SET cantidad_laminas = 34 WHERE nombre = 'Blanco Puro';
UPDATE public.materiales SET cantidad_laminas = 9 WHERE nombre = 'Carrara';
UPDATE public.materiales SET cantidad_laminas = 17 WHERE nombre = 'Gris Estelar';

-- =====================================================
-- PASO 4: VERIFICACIÓN
-- =====================================================

-- Ver materiales únicos con sus sobrantes unificados
SELECT 
  m.nombre,
  m.cantidad_laminas,
  ROUND(m.cantidad_laminas * 3.22, 2) as metros_lineales,
  COALESCE(s.sobros_m2, 0) as sobrantes_m2,
  m.precio_costo,
  m.precio_venta,
  m.precio_lineal,
  CASE WHEN m.imagen_url IS NOT NULL THEN 'Si' ELSE 'No' END as tiene_imagen
FROM public.materiales m
LEFT JOIN (
  SELECT material_id, SUM(metros_lineales) as sobros_m2
  FROM public.sobros
  WHERE usado = false
  GROUP BY material_id
) s ON s.material_id = m.id
ORDER BY m.nombre;

-- Contar materiales únicos
SELECT 
  COUNT(DISTINCT nombre) as materiales_unicos,
  SUM(cantidad_laminas) as total_laminas
FROM public.materiales;

-- Ver sobrantes unificados
SELECT 
  m.nombre,
  s.metros_lineales as sobrantes_m2,
  s.notas
FROM public.sobros s
JOIN public.materiales m ON m.id = s.material_id
WHERE s.usado = false
ORDER BY m.nombre;
