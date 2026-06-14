import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";
import { getBearerToken, verifySessionToken } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido.");
  }

  try {
    const token = getBearerToken(req);
    const payload = verifySessionToken(token);

    const docentes = await sql`
      SELECT
        id,
        nombre,
        email,
        rol,
        activo,
        debe_cambiar_password
      FROM docentes
      WHERE id = ${Number(payload.sub)}
      LIMIT 1;
    `;

    if (docentes.length === 0 || !docentes[0].activo) {
      return sendError(res, 401, "Sesión inválida.");
    }

    return res.status(200).json({
      ok: true,
      usuario: docentes[0],
    });
  } catch (error) {
    return sendError(res, 401, "Sesión vencida o inválida.");
  }
}
