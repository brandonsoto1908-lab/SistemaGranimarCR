-- Inserción de materiales iniciales con stock

-- =====================================================
-- MATERIALES INICIALES
-- =====================================================

INSERT INTO public.materiales (nombre, cantidad_laminas, precio_costo, precio_venta, precio_lineal, precio_por_metro)
VALUES
  ('Calacatta Rojo', 17, 0, 0, 0, 0),
  ('Calacatta Gris', 20, 0, 0, 0, 0),
  ('Calacatta Gold', 13, 0, 0, 0, 0),
  ('Negro Marquina', 6, 0, 0, 0, 0),
  ('Chispa Beige', 22, 0, 0, 0, 0),
  ('Blanco Estelar', 0, 0, 0, 0, 0),
  ('Chispa Fina', 0, 0, 0, 0, 0),
  ('Chispa Negra', 26, 0, 0, 0, 0),
  ('Blanco Puro', 0, 0, 0, 0, 0),
  ('Carrara', 10, 0, 0, 0, 0);

-- NOTA: Los precios están en 0, debes configurarlos manualmente desde la interfaz web
-- usando la opción "Editar" en cada material.
