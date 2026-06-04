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

  try {
    let ranking;

    if (grupoId) {
      ranking = await sql`
        SELECT *
        FROM vista_ranking_botellas
        WHERE grupo_id = ${Number(grupoId)}
        ORDER BY posicion ASC;
      `;
    } else {
      ranking = await sql`
        SELECT *
        FROM vista_ranking_botellas
        ORDER BY grupo ASC, posicion ASC;
      `;
    }

    return res.status(200).json(ranking);
  } catch (error) {
    console.error("Error en /api/ranking:", error);

    return sendError(res, 500, "Error al obtener ranking", error.message);
  }
}
