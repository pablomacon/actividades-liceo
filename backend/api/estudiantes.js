import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido");
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const grupoId = url.searchParams.get("grupo_id");

  if (!grupoId) {
    return sendError(res, 400, "Falta grupo_id");
  }

  try {
    const estudiantes = await sql`
      SELECT
        e.id,
        e.nombre_completo,
        i.id AS inscripcion_id,
        i.numero_lista
      FROM inscripciones i
      JOIN estudiantes e ON e.id = i.estudiante_id
      WHERE i.grupo_id = ${Number(grupoId)}
        AND i.activo = TRUE
        AND e.activo = TRUE
      ORDER BY i.numero_lista ASC;
    `;

    return res.status(200).json(estudiantes);
  } catch (error) {
    console.error("Error en /api/estudiantes:", error);

    return sendError(
      res,
      500,
      "Error al obtener estudiantes",
      error.message
    );
  }
}