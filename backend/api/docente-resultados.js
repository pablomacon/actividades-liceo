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
    metricas.metrica_1_valor = intento.total_intercambios;
    metricas.metrica_2_nombre = "Adivinanzas";
    metricas.metrica_2_valor = intento.total_adivinanzas;
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
    metricas.metrica_1_valor = intento.total_intercambios;
    metricas.metrica_2_nombre = "Revisiones con índice";
    metricas.metrica_2_valor = intento.total_adivinanzas;
  }

  if (slug === "criptografos-01") {
    metricas.metrica_1_nombre = "Interferencia total";
    metricas.metrica_1_valor = intento.total_intercambios;
    metricas.metrica_2_nombre = "Saltos entre nodos";
    metricas.metrica_2_valor = intento.total_adivinanzas;
  }

  return metricas;
}

function formatearTiempo(segundos) {
  const total = Number(segundos ?? 0);
  const minutos = Math.floor(total / 60);
  const resto = total % 60;

  return `${minutos} min ${resto} s`;
}

function normalizarLimite(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return 200;
  if (numero < 1) return 1;
  if (numero > 500) return 500;

  return numero;
}

function calcularResumen(intentos) {
  const estudiantesUnicos = new Set(
    intentos.map((i) => String(i.estudiante_id)),
  );
  const completados = intentos.filter((i) => i.completado).length;
  const noCompletados = intentos.length - completados;

  const totalTiempo = intentos.reduce(
    (acum, i) => acum + Number(i.tiempo_segundos ?? 0),
    0,
  );

  const promedioTiempoSegundos =
    intentos.length > 0 ? Math.round(totalTiempo / intentos.length) : 0;

  const intentosPorEstudiante = new Map();

  for (const intento of intentos) {
    const id = String(intento.estudiante_id);
    intentosPorEstudiante.set(id, (intentosPorEstudiante.get(id) || 0) + 1);
  }

  const promedioIntentosPorEstudiante =
    estudiantesUnicos.size > 0
      ? Number((intentos.length / estudiantesUnicos.size).toFixed(2))
      : 0;

  return {
    total_intentos: intentos.length,
    estudiantes_con_actividad: estudiantesUnicos.size,
    completados,
    no_completados: noCompletados,
    promedio_tiempo_segundos: promedioTiempoSegundos,
    promedio_tiempo: formatearTiempo(promedioTiempoSegundos),
    promedio_intentos_por_estudiante: promedioIntentosPorEstudiante,
  };
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

    const grupoIdFiltro = grupo_id ? Number(grupo_id) : null;
    const juegoSlugFiltro = juego_slug || null;
    const anioLectivoFiltro = Number(anio_lectivo);
    const limiteFiltro = normalizarLimite(limite);

    const grupos = await sql`
      SELECT
        id,
        nombre,
        anio_lectivo,
        nivel
      FROM grupos
      WHERE anio_lectivo = ${anioLectivoFiltro}
        AND activo = true
      ORDER BY nombre;
    `;

    const juegos = await sql`
      SELECT
        id,
        slug,
        titulo,
        categoria,
        anio_lectivo,
        nivel,
        tipo_resultado,
        activo,
        visible_en_hub,
        max_intentos_por_estudiante
      FROM juegos
      WHERE anio_lectivo = ${anioLectivoFiltro}
        AND visible_en_hub = true
      ORDER BY id;
    `;

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
        e.nombre_completo,

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
      WHERE g.anio_lectivo = ${anioLectivoFiltro}
        AND (${grupoIdFiltro}::int IS NULL OR g.id = ${grupoIdFiltro})
        AND (${juegoSlugFiltro}::text IS NULL OR j.slug = ${juegoSlugFiltro})
      ORDER BY
        g.nombre,
        e.nombre_completo,
        j.titulo,
        i.numero_intento
      LIMIT ${limiteFiltro};
    `;

    const intentos = filas.map((fila) => {
      const metricas = traducirMetricas(fila.juego_slug, fila);

      return {
        id: fila.id,
        estudiante_id: fila.estudiante_id,
        estudiante: fila.nombre_completo,
        nombre_completo: fila.nombre_completo,

        grupo_id: fila.grupo_id,
        grupo: fila.grupo_nombre,

        juego_id: fila.juego_id,
        juego_slug: fila.juego_slug,
        actividad: fila.juego_titulo,
        categoria: fila.juego_categoria,

        numero_intento: fila.numero_intento,
        resultado: traducirResultado(fila.completado),
        completado: fila.completado,

        tiempo_segundos: fila.tiempo_total_segundos,
        tiempo: formatearTiempo(fila.tiempo_total_segundos),
        fecha: fila.fecha,

        ...metricas,
      };
    });

    const resumen = calcularResumen(intentos);

    return res.status(200).json({
      ok: true,
      usuario: {
        id: payload.sub,
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
      },
      filtros: {
        grupo_id: grupoIdFiltro,
        juego_slug: juegoSlugFiltro,
        anio_lectivo: anioLectivoFiltro,
        limite: limiteFiltro,
      },
      opciones: {
        grupos,
        juegos,
      },
      resumen,
      total: intentos.length,
      intentos,
    });
  } catch (error) {
    console.error("Error en /api/docente-resultados:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Error al consultar resultados.",
      detalle: error.message,
      code: error.code || null,
    });
  }
}
