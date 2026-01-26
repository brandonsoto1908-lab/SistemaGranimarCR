-- Migration/Script: 027_backfill_facturacion_material_from_retiros.sql
-- Copia los campos de material desde 'retiros' a 'facturacion' cuando falten en facturacion.
-- Ejecutar en Supabase SQL editor o con psql. Hacer backup antes de ejecutar.

BEGIN;

-- Ver cuántas filas se actualizarían (tratando 0 como ausencia de cantidad)
SELECT COUNT(*) AS filas_a_actualizar
FROM facturacion f
JOIN retiros r ON f.retiro_id = r.id
WHERE f.tipo_material IS NULL
  AND (
    r.tipo_material IS NOT NULL
    OR NULLIF(r.cantidad_material, 0) IS NOT NULL
    OR NULLIF(r.cantidad_laminas, 0) IS NOT NULL
    OR NULLIF(r.metros_lineales, 0) IS NOT NULL
  );

-- Actualizar facturacion desde retiros (solo donde facturacion.tipo_material IS NULL)
-- Uso de NULLIF(..., 0) para evitar copiar cantidades significativas 0.
UPDATE facturacion f
SET tipo_material     = r.tipo_material,
    cantidad_material = COALESCE(NULLIF(r.cantidad_material, 0), NULLIF(r.cantidad_laminas, 0), NULLIF(r.metros_lineales, 0)),
    unidad_material   = COALESCE(r.unidad_material,
                        CASE
                          WHEN NULLIF(r.cantidad_laminas, 0) IS NOT NULL THEN 'láminas'
                          WHEN NULLIF(r.metros_lineales, 0) IS NOT NULL THEN 'ml'
                          ELSE NULL
                        END)
FROM retiros r
WHERE f.retiro_id = r.id
  AND f.tipo_material IS NULL
  AND (
    r.tipo_material IS NOT NULL
    OR NULLIF(r.cantidad_material, 0) IS NOT NULL
    OR NULLIF(r.cantidad_laminas, 0) IS NOT NULL
    OR NULLIF(r.metros_lineales, 0) IS NOT NULL
  );

-- Verificación rápida después de la actualización
SELECT COUNT(*) AS facturas_sin_material_restantes FROM facturacion WHERE tipo_material IS NULL AND retiro_id IS NOT NULL;

COMMIT;

-- Nota: Este script está pensado para ejecutarse una sola vez en producción. Haz una copia de seguridad antes.

-- OPTIONAL: Si solo quieres actualizar facturas concretas (IDs que proporcionaste),
-- puedes ejecutar este UPDATE dirigido. Está comentado por seguridad;
-- descomenta y ajusta si quieres aplicarlo solo a esos IDs.
--
-- BEGIN;
-- UPDATE facturacion f
-- SET tipo_material     = r.tipo_material,
--     cantidad_material = COALESCE(NULLIF(r.cantidad_material,0), NULLIF(r.cantidad_laminas,0), NULLIF(r.metros_lineales,0)),
--     unidad_material   = COALESCE(r.unidad_material,
--                         CASE
--                           WHEN NULLIF(r.cantidad_laminas,0) IS NOT NULL THEN 'láminas'
--                           WHEN NULLIF(r.metros_lineales,0) IS NOT NULL THEN 'ml'
--                           ELSE NULL
--                         END)
-- FROM retiros r
-- WHERE f.retiro_id = r.id
--   AND f.tipo_material IS NULL
--   AND f.id IN (
--     '2a1cb690-1b86-4c75-88ce-dae1b28717b2',
--     '973884bf-78cb-4cbb-9459-498fda132270',
--     '46edb299-aac6-4ba5-bd5d-60445181e2f0',
--     '6441db5c-95f6-4b43-8d6e-95187be4f52b',
--     '2dc3f263-99d8-4ea9-a554-ed4b324e6222',
--     '89d8c6b6-6437-4aed-ad59-64d9ccd1b5d3',
--     'f135d282-7b0d-470b-870a-2c5590c25f4f',
--     'cd00686b-0a24-414a-a800-58c39a887205',
--     '5c00b2ab-a226-4907-83b8-3cbe013bd239',
--     '87c1ddc5-0968-47a0-ad8b-59b53d6fe9e7'
--   );
-- COMMIT;
