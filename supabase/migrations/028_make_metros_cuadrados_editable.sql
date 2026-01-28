-- Migration: 028_make_metros_cuadrados_editable.sql
-- Objetivo: Convertir la columna `metros_cuadrados` en una columna editable (numeric), preservando datos.
-- Uso: Ejecutar en Supabase SQL editor o con psql. Hacer backup antes de ejecutar.

BEGIN;

-- Crear columna temporal donde copiar los valores actuales (si existieran)
ALTER TABLE IF EXISTS retiros ADD COLUMN IF NOT EXISTS metros_cuadrados_new numeric;

-- Si existe la columna actual `metros_cuadrados`, copiar sus valores a la nueva columna
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'retiros' AND column_name = 'metros_cuadrados'
  ) THEN
    EXECUTE 'UPDATE retiros SET metros_cuadrados_new = metros_cuadrados';
  END IF;
END$$;

-- Eliminar la columna antigua (si existe). Esto eliminará cualquier definición generada/computed.
ALTER TABLE IF EXISTS retiros DROP COLUMN IF EXISTS metros_cuadrados;

-- Renombrar la columna nueva al nombre original
ALTER TABLE IF EXISTS retiros RENAME COLUMN metros_cuadrados_new TO metros_cuadrados;

COMMIT;

-- Nota: Después de ejecutar, `metros_cuadrados` será una columna numeric normal y editable.
-- Revisa índices, restricciones y triggers que puedan depender de la versión anterior.
