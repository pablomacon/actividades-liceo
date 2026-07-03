import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendJson, sendError } from "./_utils.js";

function normalizarId(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export default async function handler(req, res) {
  setCors(res);

  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido.");
  }

  const { juego_slug, estudiante_id, grupo_id } = req.query;

  const estudianteId = normalizarId(estudiante_id);
  const grupoId = normalizarId(grupo_id);

  if (!juego_slug || !estudianteId) {
    return sendError(res, 400, "Faltan juego_slug o estudiante_id.");
  }

  if (!grupoId) {
    return sendError(res, 400, "Falta grupo_id.");
  }

  try {
    const juegoResult = await sql`
      SELECT
        id,
        slug,
        titulo,
        activo,
        COALESCE(max_intentos_por_estudiante, 1) AS max_intentos_por_estudiante,
        mensaje_inactivo
      FROM juegos
      WHERE slug = ${juego_slug}
      LIMIT 1;
    `;

    if (juegoResult.length === 0) {
      return sendError(res, 404, "Juego no encontrado.");
    }

    const juego = juegoResult[0];
    const maxIntentos = Number(juego.max_intentos_por_estudiante ?? 1);

    const intentosResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM intentos_juego
      WHERE juego_id = ${juego.id}
        AND estudiante_id = ${estudianteId};
    `;

    const intentosRealizados = Number(intentosResult[0]?.total ?? 0);
    const intentosRestantes = Math.max(maxIntentos - intentosRealizados, 0);

    if (!juego.activo) {
      return sendJson(res, 200, {
        puede_jugar: false,
        motivo:
          juego.mensaje_inactivo ||
          "Esta actividad no está disponible en este momento.",
        intentos_realizados: intentosRealizados,
        max_intentos: maxIntentos,
        intentos_restantes: intentosRestantes,
        juego_activo: false,
        grupo_habilitado: false,
      });
    }

    const habilitacionResult = await sql`
      SELECT
        jg.habilitado,
        g.activo AS grupo_activo
      FROM juegos_grupos jg
      JOIN grupos g ON g.id = jg.grupo_id
      WHERE jg.juego_id = ${juego.id}
        AND jg.grupo_id = ${grupoId}
      LIMIT 1;
    `;

    const habilitacion = habilitacionResult[0] || null;
    const grupoHabilitado =
      habilitacion?.habilitado === true && habilitacion?.grupo_activo === true;

    if (!grupoHabilitado) {
      return sendJson(res, 200, {
        puede_jugar: false,
        motivo:
          "Esta actividad no está habilitada para tu grupo en este momento.",
        intentos_realizados: intentosRealizados,
        max_intentos: maxIntentos,
        intentos_restantes: intentosRestantes,
        juego_activo: true,
        grupo_habilitado: false,
      });
    }

    if (intentosRealizados >= maxIntentos) {
      return sendJson(res, 200, {
        puede_jugar: false,
        motivo: `Ya realizaste los ${maxIntentos} intentos disponibles para esta actividad.`,
        intentos_realizados: intentosRealizados,
        max_intentos: maxIntentos,
        intentos_restantes: 0,
        juego_activo: true,
        grupo_habilitado: true,
      });
    }

    return sendJson(res, 200, {
      puede_jugar: true,
      motivo: "Puede jugar.",
      intentos_realizados: intentosRealizados,
      max_intentos: maxIntentos,
      intentos_restantes: intentosRestantes,
      juego_activo: true,
      grupo_habilitado: true,
    });
  } catch (error) {
    console.error("Error en /api/estado-intento:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    return sendError(res, 500, "Error al consultar el estado del intento.");
  }
}
