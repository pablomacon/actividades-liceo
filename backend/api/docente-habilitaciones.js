import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError, sendJson } from "./_utils.js";
import { getBearerToken, verifySessionToken } from "./_auth.js";

function normalizarAnio(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 2026;
}

function normalizarIds(valor) {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function esSeleccionCompleta(idsSeleccionados, idsDisponibles) {
  if (idsDisponibles.length === 0) return false;
  if (idsSeleccionados.length !== idsDisponibles.length) return false;

  const seleccionados = new Set(idsSeleccionados.map(String));
  return idsDisponibles.every((id) => seleccionados.has(String(id)));
}

async function obtenerDatos(anioLectivo) {
  const grupos = await sql`
    SELECT
      id,
      nombre,
      anio_lectivo,
      nivel,
      activo
    FROM grupos
    WHERE anio_lectivo = ${anioLectivo}
      AND activo = true
    ORDER BY nombre;
  `;

  const juegos = await sql`
    SELECT
      id,
      slug,
      titulo,
      categoria,
      descripcion,
      activo,
      anio_lectivo,
      nivel,
      tipo_resultado,
      visible_en_hub,
      max_intentos_por_estudiante
    FROM juegos
    WHERE anio_lectivo = ${anioLectivo}
      AND visible_en_hub = true
    ORDER BY id;
  `;

  const habilitaciones = await sql`
    SELECT
      jg.id,
      jg.juego_id,
      jg.grupo_id,
      jg.habilitado,
      jg.fecha_habilitacion,
      j.activo AS activo_global
    FROM juegos_grupos jg
    JOIN juegos j ON j.id = jg.juego_id
    JOIN grupos g ON g.id = jg.grupo_id
    WHERE g.anio_lectivo = ${anioLectivo}
      AND j.anio_lectivo = ${anioLectivo}
      AND g.activo = true
      AND j.visible_en_hub = true
    ORDER BY j.id, g.nombre;
  `;

  return {
    grupos,
    juegos,
    habilitaciones,
  };
}

async function asegurarCombinaciones(anioLectivo) {
  await sql`
    INSERT INTO juegos_grupos (
      juego_id,
      grupo_id,
      habilitado
    )
    SELECT
      j.id,
      g.id,
      false
    FROM juegos j
    CROSS JOIN grupos g
    WHERE j.anio_lectivo = ${anioLectivo}
      AND g.anio_lectivo = ${anioLectivo}
      AND j.visible_en_hub = true
      AND g.activo = true
    ON CONFLICT (juego_id, grupo_id)
    DO NOTHING;
  `;
}

async function manejarGet(req, res, payload) {
  const anioLectivo = normalizarAnio(req.query.anio_lectivo);

  await asegurarCombinaciones(anioLectivo);

  const datos = await obtenerDatos(anioLectivo);

  return sendJson(res, 200, {
    ok: true,
    usuario: {
      id: payload.sub,
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
    },
    anio_lectivo: anioLectivo,
    ...datos,
  });
}

async function manejarPost(req, res, payload) {
  if (payload.rol !== "admin") {
    return sendError(
      res,
      403,
      "No tenés permisos para modificar habilitaciones.",
    );
  }

  const {
    grupo_ids,
    juego_ids,
    habilitado,
    anio_lectivo = 2026,
  } = req.body || {};

  const anioLectivo = normalizarAnio(anio_lectivo);
  const grupoIds = normalizarIds(grupo_ids);
  const juegoIds = normalizarIds(juego_ids);

  if (grupoIds.length === 0) {
    return sendError(res, 400, "Seleccioná al menos un grupo.");
  }

  if (juegoIds.length === 0) {
    return sendError(res, 400, "Seleccioná al menos una actividad.");
  }

  if (typeof habilitado !== "boolean") {
    return sendError(res, 400, "El campo habilitado debe ser true o false.");
  }

  await asegurarCombinaciones(anioLectivo);

  const gruposDisponibles = await sql`
    SELECT id
    FROM grupos
    WHERE anio_lectivo = ${anioLectivo}
      AND activo = true
    ORDER BY id;
  `;

  const juegosDisponibles = await sql`
    SELECT id
    FROM juegos
    WHERE anio_lectivo = ${anioLectivo}
      AND visible_en_hub = true
    ORDER BY id;
  `;

  const grupoIdsDisponibles = gruposDisponibles.map((grupo) =>
    Number(grupo.id),
  );
  const juegoIdsDisponibles = juegosDisponibles.map((juego) =>
    Number(juego.id),
  );

  const grupoIdsValidos = grupoIds.filter((id) =>
    grupoIdsDisponibles.includes(id),
  );

  const juegoIdsValidos = juegoIds.filter((id) =>
    juegoIdsDisponibles.includes(id),
  );

  if (grupoIdsValidos.length === 0) {
    return sendError(res, 400, "Los grupos seleccionados no son válidos.");
  }

  if (juegoIdsValidos.length === 0) {
    return sendError(res, 400, "Las actividades seleccionadas no son válidas.");
  }

  await sql`
    UPDATE juegos_grupos
    SET
      habilitado = ${habilitado},
      fecha_habilitacion = NOW()
    WHERE grupo_id = ANY(${grupoIdsValidos}::int[])
      AND juego_id = ANY(${juegoIdsValidos}::int[]);
  `;

  if (habilitado) {
    await sql`
      UPDATE juegos
      SET activo = true
      WHERE id = ANY(${juegoIdsValidos}::int[])
        AND anio_lectivo = ${anioLectivo};
    `;
  } else {
    const todosLosGruposSeleccionados = esSeleccionCompleta(
      grupoIdsValidos,
      grupoIdsDisponibles,
    );

    if (todosLosGruposSeleccionados) {
      await sql`
        UPDATE juegos
        SET activo = false
        WHERE id = ANY(${juegoIdsValidos}::int[])
          AND anio_lectivo = ${anioLectivo};
      `;
    }
  }

  const datos = await obtenerDatos(anioLectivo);

  return sendJson(res, 200, {
    ok: true,
    mensaje: habilitado
      ? "Actividades habilitadas correctamente."
      : "Actividades deshabilitadas correctamente.",
    accion: habilitado ? "habilitar" : "deshabilitar",
    seleccion: {
      grupo_ids: grupoIdsValidos,
      juego_ids: juegoIdsValidos,
      habilitado,
      anio_lectivo: anioLectivo,
    },
    ...datos,
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const token = getBearerToken(req);
    const payload = verifySessionToken(token);

    if (!["admin", "practicante"].includes(payload.rol)) {
      return sendError(
        res,
        403,
        "No tenés permisos para consultar habilitaciones.",
      );
    }

    if (req.method === "GET") {
      return await manejarGet(req, res, payload);
    }

    if (req.method === "POST") {
      return await manejarPost(req, res, payload);
    }

    return sendError(res, 405, "Método no permitido.");
  } catch (error) {
    console.error("Error en /api/docente-habilitaciones:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    return sendJson(res, 500, {
      error: "Error al gestionar habilitaciones.",
      detalle: error.message,
      code: error.code || null,
    });
  }
}
