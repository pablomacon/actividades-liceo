import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido");
  }

  try {
    const grupos = await sql`
      SELECT id, nombre, anio_lectivo, nivel
      FROM grupos
      WHERE activo = TRUE
        AND anio_lectivo = 2026
      ORDER BY nombre;
    `;

    return res.status(200).json(grupos);
  } catch (error) {
    console.error("Error en /api/grupos:", error);
    return sendError(res, 500, "Error al obtener grupos");
  }
}
