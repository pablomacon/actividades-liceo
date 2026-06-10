import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendJson, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);

  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido.");
  }

  const { slug } = req.query;

  if (!slug) {
    return sendError(res, 400, "Falta el slug del juego.");
  }

  try {
    const result = await sql`
      SELECT
        id,
        slug,
        titulo,
        descripcion,
        activo,
        categoria,
        anio_lectivo,
        nivel,
        tipo_resultado,
        visible_en_hub,
        max_intentos_por_estudiante,
        mensaje_inactivo
      FROM juegos
      WHERE slug = ${slug}
      LIMIT 1;
    `;

    if (result.length === 0) {
      return sendError(res, 404, "Juego no encontrado.");
    }

    return sendJson(res, 200, result[0]);
  } catch (error) {
    console.error("Error en /api/juego:", error);
    return sendError(res, 500, "Error al consultar el juego.");
  }
}
