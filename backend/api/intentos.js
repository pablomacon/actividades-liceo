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
      SELECT id
      FROM juegos
      WHERE slug = ${juego_slug}
        AND activo = TRUE
      LIMIT 1;
    `;

    if (juegos.length === 0) {
      return sendError(res, 404, "Juego no encontrado o inactivo");
    }

    const juegoId = juegos[0].id;

    const numeroIntentoRows = await sql`
      SELECT COUNT(*)::int + 1 AS numero_intento
      FROM intentos_juego
      WHERE juego_id = ${juegoId}
        AND estudiante_id = ${Number(estudiante_id)}
        AND grupo_id = ${Number(grupo_id)};
    `;

    const numeroIntento = numeroIntentoRows[0].numero_intento;

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
    });
  } catch (error) {
    console.error("Error en /api/intentos:", error);

    return sendError(res, 500, "Error al guardar intento", error.message);
  }
}
