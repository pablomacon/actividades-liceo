import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendJson, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);

  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido.");
  }

  const { juego_slug, estudiante_id } = req.query;

  if (!juego_slug || !estudiante_id) {
    return sendError(res, 400, "Faltan juego_slug o estudiante_id.");
  }

  try {
    const juegoResult = await sql`
      SELECT
        id,
        slug,
        titulo,
        activo,
        max_intentos_por_estudiante,
        mensaje_inactivo
      FROM juegos
      WHERE slug = ${juego_slug}
      LIMIT 1;
    `;

    if (juegoResult.length === 0) {
      return sendError(res, 404, "Juego no encontrado.");
    }

    const juego = juegoResult[0];

    const intentosResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM intentos_juego
      WHERE juego_id = ${juego.id}
        AND estudiante_id = ${Number(estudiante_id)}
        AND completado = true;
    `;

    const intentosRealizados = intentosResult[0]?.total ?? 0;
    const maxIntentos = juego.max_intentos_por_estudiante ?? 1;

    if (!juego.activo) {
      return sendJson(res, 200, {
        puede_jugar: false,
        motivo:
          juego.mensaje_inactivo ||
          "Esta actividad no está disponible en este momento.",
        intentos_realizados: intentosRealizados,
        max_intentos: maxIntentos,
        juego_activo: false,
      });
    }

    if (intentosRealizados >= maxIntentos) {
      return sendJson(res, 200, {
        puede_jugar: false,
        motivo: `Ya realizaste los ${maxIntentos} intentos disponibles para esta actividad.`,
        intentos_realizados: intentosRealizados,
        max_intentos: maxIntentos,
        juego_activo: true,
      });
    }

    return sendJson(res, 200, {
      puede_jugar: true,
      motivo: "Puede jugar.",
      intentos_realizados: intentosRealizados,
      max_intentos: maxIntentos,
      intentos_restantes: maxIntentos - intentosRealizados,
      juego_activo: true,
    });
  } catch (error) {
    console.error("Error en /api/estado-intento:", error);
    return sendError(res, 500, "Error al consultar el estado del intento.");
  }
}
