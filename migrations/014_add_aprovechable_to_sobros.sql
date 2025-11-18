-- =====================================================
-- AGREGAR COLUMNA APROVECHABLE A SOBROS
-- =====================================================
-- Esta columna permite marcar si un sobrante es utilizable o no
-- Por defecto todos los sobrantes son aprovechables (true)

-- Agregar columna aprovechable
ALTER TABLE public.sobros 
ADD COLUMN IF NOT EXISTS aprovechable BOOLEAN DEFAULT true;

-- Actualizar los sobrantes existentes como aprovechables
UPDATE public.sobros 
SET aprovechable = true 
WHERE aprovechable IS NULL;

-- Hacer la columna NOT NULL después de establecer valores por defecto
ALTER TABLE public.sobros 
ALTER COLUMN aprovechable SET NOT NULL;

-- Verificación
SELECT 
  m.nombre,
  s.metros_lineales as m2,
  s.aprovechable,
  s.usado,
  s.notas
FROM public.sobros s
JOIN public.materiales m ON m.id = s.material_id
ORDER BY m.nombre, s.created_at;
