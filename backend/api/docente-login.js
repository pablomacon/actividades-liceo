import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendError(res, 405, "Método no permitido");
  }

  const { email } = req.body || {};

  if (!email) {
    return sendError(res, 400, "Falta email");
  }

  try {
    const docentes = await sql`
      SELECT id, nombre, email, rol
      FROM docentes
      WHERE LOWER(email) = LOWER(${email})
        AND activo = TRUE
      LIMIT 1;
    `;

    if (docentes.length === 0) {
      return sendError(res, 401, "Docente no autorizado");
    }

    return res.status(200).json({
      ok: true,
      docente: docentes[0],
    });
  } catch (error) {
    console.error("Error en /api/docente-login:", error);

    return sendError(res, 500, "Error al validar docente", error.message);
  }
}
