import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";

function normalizarId(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function normalizarNumero(valor, defecto = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : defecto;
}

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

  const estudianteId = normalizarId(estudiante_id);
  const grupoId = normalizarId(grupo_id);
  const inscripcionId = inscripcion_id ? normalizarId(inscripcion_id) : null;

  if (!juego_slug || !estudianteId || !grupoId) {
    return sendError(res, 400, "Faltan datos obligatorios");
  }

  if (
    total_intercambios === undefined ||
    total_adivinanzas === undefined ||
    tiempo_total_segundos === undefined
  ) {
    return sendError(res, 400, "Faltan métricas del intento");
  }

  const totalIntercambios = normalizarNumero(total_intercambios);
  const totalAdivinanzas = normalizarNumero(total_adivinanzas);
  const tiempoTotalSegundos = normalizarNumero(tiempo_total_segundos);
  const intentoCompletado = completado ?? true;

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

    const habilitacionRows = await sql`
      SELECT habilitado
      FROM juegos_grupos
      WHERE juego_id = ${juegoId}
        AND grupo_id = ${grupoId}
      LIMIT 1;
    `;

    const grupoHabilitado = habilitacionRows[0]?.habilitado === true;

    if (!grupoHabilitado) {
      return sendError(
        res,
        403,
        "Esta actividad no está habilitada para tu grupo en este momento.",
      );
    }

    const intentosRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM intentos_juego
      WHERE juego_id = ${juegoId}
        AND estudiante_id = ${estudianteId};
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
        ${estudianteId},
        ${grupoId},
        ${inscripcionId},
        ${numeroIntento},
        ${totalIntercambios},
        ${totalAdivinanzas},
        ${tiempoTotalSegundos},
        ${intentoCompletado}
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
    console.error("Error en /api/intentos:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    return sendError(res, 500, "Error al guardar intento");
  }
}
