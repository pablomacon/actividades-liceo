import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendError(res, 405, "Método no permitido");
  }

  const {
    juego_slug,
    estudiante_id,
    grupo_id,
    inscripcion_id,
    total_intercambios,
    total_adivinanzas,
    tiempo_total_segundos,
    completado,
  } = req.body || {};

  if (!juego_slug || !estudiante_id || !grupo_id) {
    return sendError(res, 400, "Faltan datos obligatorios");
  }

  if (
    total_intercambios === undefined ||
    total_adivinanzas === undefined ||
    tiempo_total_segundos === undefined
  ) {
    return sendError(res, 400, "Faltan métricas del intento");
  }

  try {
    const juegos = await sql`
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

    if (juegos.length === 0) {
      return sendError(res, 404, "Juego no encontrado");
    }

    const juego = juegos[0];
    const juegoId = juego.id;
    const maxIntentos = Number(juego.max_intentos_por_estudiante ?? 1);

    if (!juego.activo) {
      return sendError(
        res,
        403,
        juego.mensaje_inactivo ||
          "Esta actividad no está disponible en este momento.",
      );
    }

    const intentosRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM intentos_juego
      WHERE juego_id = ${juegoId}
        AND estudiante_id = ${Number(estudiante_id)};
    `;

    const intentosRealizados = Number(intentosRows[0]?.total ?? 0);

    if (intentosRealizados >= maxIntentos) {
      return sendError(
        res,
        403,
        `Ya realizaste los ${maxIntentos} intentos disponibles para esta actividad.`,
      );
    }

    const numeroIntento = intentosRealizados + 1;

    const inserted = await sql`
      INSERT INTO intentos_juego (
        juego_id,
        estudiante_id,
        grupo_id,
        inscripcion_id,
        numero_intento,
        total_intercambios,
        total_adivinanzas,
        tiempo_total_segundos,
        completado
      )
      VALUES (
        ${juegoId},
        ${Number(estudiante_id)},
        ${Number(grupo_id)},
        ${inscripcion_id ? Number(inscripcion_id) : null},
        ${numeroIntento},
        ${Number(total_intercambios)},
        ${Number(total_adivinanzas)},
        ${Number(tiempo_total_segundos)},
        ${completado ?? true}
      )
      RETURNING id, numero_intento, fecha;
    `;

    return res.status(201).json({
      ok: true,
      intento: inserted[0],
      intentos_realizados: numeroIntento,
      max_intentos: maxIntentos,
      intentos_restantes: Math.max(maxIntentos - numeroIntento, 0),
    });
  } catch (error) {
    console.error("Error en /api/intentos:", error);

    return sendError(res, 500, "Error al guardar intento");
  }
}
