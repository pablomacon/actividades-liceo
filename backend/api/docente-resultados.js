import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";
import { getBearerToken, verifySessionToken } from "./_auth.js";

function traducirResultado(completado) {
  return completado ? "Completado" : "No completado";
}

function traducirMetricas(slug, intento) {
  const metricas = {
    metrica_1_nombre: "Métrica 1",
    metrica_1_valor: intento.total_intercambios,
    metrica_2_nombre: "Métrica 2",
    metrica_2_valor: intento.total_adivinanzas,
  };

  if (slug === "botellas-algoritmos-01") {
    metricas.metrica_1_nombre = "Intercambios";
    metricas.metrica_2_nombre = "Adivinanzas";
  }

  if (
    slug === "candado-numerico-01" ||
    slug === "candado-nivel-2" ||
    slug === "candado-nivel-3"
  ) {
    metricas.metrica_1_nombre = "Apertura";
    metricas.metrica_1_valor = intento.completado ? "Abrió" : "No abrió";
    metricas.metrica_2_nombre = "Combinaciones probadas";
    metricas.metrica_2_valor = intento.total_adivinanzas;
  }

  if (slug === "radar-puerto-01") {
    metricas.metrica_1_nombre = "Resultado";
    metricas.metrica_1_valor = intento.completado ? "Encontró" : "No encontró";
    metricas.metrica_2_nombre = "Escaneos usados";
    metricas.metrica_2_valor = intento.total_adivinanzas;
  }

  if (slug === "almacen-central-01") {
    metricas.metrica_1_nombre = "Revisiones sin índice";
    metricas.metrica_2_nombre = "Revisiones con índice";
  }

  if (slug === "criptografos-01") {
    metricas.metrica_1_nombre = "Interferencia total";
    metricas.metrica_2_nombre = "Saltos entre nodos";
  }

  return metricas;
}

function formatearTiempo(segundos) {
  const total = Number(segundos ?? 0);
  const minutos = Math.floor(total / 60);
  const resto = total % 60;

  return `${minutos} min ${resto} s`;
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Método no permitido.");
  }

  try {
    const token = getBearerToken(req);
    const payload = verifySessionToken(token);

    if (!["admin", "practicante"].includes(payload.rol)) {
      return sendError(
        res,
        403,
        "No tenés permisos para consultar resultados.",
      );
    }

    const {
      grupo_id,
      juego_slug,
      anio_lectivo = "2026",
      limite = "200",
    } = req.query;

    const filas = await sql`
      SELECT
        i.id,
        i.numero_intento,
        i.total_intercambios,
        i.total_adivinanzas,
        i.tiempo_total_segundos,
        i.completado,
        i.fecha,

        e.id AS estudiante_id,
        e.nombres,
        e.apellidos,

        g.id AS grupo_id,
        g.nombre AS grupo_nombre,

        j.id AS juego_id,
        j.slug AS juego_slug,
        j.titulo AS juego_titulo,
        j.categoria AS juego_categoria
      FROM intentos_juego i
      JOIN estudiantes e ON e.id = i.estudiante_id
      JOIN grupos g ON g.id = i.grupo_id
      JOIN juegos j ON j.id = i.juego_id
      WHERE g.anio_lectivo = ${Number(anio_lectivo)}
        AND (${grupo_id ? Number(grupo_id) : null}::int IS NULL OR g.id = ${grupo_id ? Number(grupo_id) : null})
        AND (${juego_slug || null}::text IS NULL OR j.slug = ${juego_slug || null})
      ORDER BY
        g.nombre,
        e.apellidos,
        e.nombres,
        j.titulo,
        i.numero_intento
      LIMIT ${Number(limite)};
    `;

    const intentos = filas.map((fila) => {
      const metricas = traducirMetricas(fila.juego_slug, fila);

      return {
        id: fila.id,
        estudiante_id: fila.estudiante_id,
        estudiante: `${fila.apellidos}, ${fila.nombres}`,
        apellidos: fila.apellidos,
        nombres: fila.nombres,
        grupo_id: fila.grupo_id,
        grupo: fila.grupo_nombre,
        juego_id: fila.juego_id,
        juego_slug: fila.juego_slug,
        actividad: fila.juego_titulo,
        numero_intento: fila.numero_intento,
        resultado: traducirResultado(fila.completado),
        completado: fila.completado,
        tiempo_segundos: fila.tiempo_total_segundos,
        tiempo: formatearTiempo(fila.tiempo_total_segundos),
        fecha: fila.fecha,
        ...metricas,
      };
    });

    return res.status(200).json({
      ok: true,
      usuario: {
        id: payload.sub,
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
      },
      filtros: {
        grupo_id: grupo_id || null,
        juego_slug: juego_slug || null,
        anio_lectivo: Number(anio_lectivo),
      },
      total: intentos.length,
      intentos,
    });
  } catch (error) {
    console.error("Error en /api/docente-resultados:", error);
    return sendError(
      res,
      401,
      "Sesión inválida o error al consultar resultados.",
    );
  }
}
