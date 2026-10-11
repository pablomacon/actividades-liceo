-- Bucles en EduBlocks: evidencia pedagógica y alta de actividad.
-- Aplicación manual: esta migración no se ejecuta desde la aplicación.
-- PostgreSQL / Neon. Es segura para volver a ejecutar.

BEGIN;

ALTER TABLE intentos_juego
  ADD COLUMN IF NOT EXISTS evidencia_json JSONB NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO juegos (
  slug,
  titulo,
  categoria,
  descripcion,
  activo,
  anio_lectivo,
  nivel,
  tipo_resultado,
  visible_en_hub,
  max_intentos_por_estudiante,
  mensaje_inactivo
)
VALUES (
  'bucles-edublocks-01',
  'Bucles en EduBlocks',
  'Bloques',
  'Unidad de programación para comprender cómo for repite instrucciones en EduBlocks.',
  FALSE,
  2026,
  '7.º',
  'comprobacion',
  TRUE,
  1,
  'Bucles en EduBlocks todavía no está habilitada para tu grupo. Avisá al docente si creés que debería estar disponible.'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- Verificación manual posterior:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'intentos_juego'
--   AND column_name = 'evidencia_json';
--
-- SELECT slug, titulo, categoria, activo, anio_lectivo, nivel,
--        visible_en_hub, max_intentos_por_estudiante, mensaje_inactivo
-- FROM juegos
-- WHERE slug = 'bucles-edublocks-01';
