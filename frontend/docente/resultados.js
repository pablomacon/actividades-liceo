const API_BASE_URL = "https://backend-actividades-liceo.vercel.app/api";

const tablaBody = document.querySelector("#tablaResultados tbody");
const estado = document.querySelector("#estadoResultados");
const totalResultados = document.querySelector("#totalResultados");

const filtroGrupo = document.querySelector("#filtroGrupo");
const filtroActividad = document.querySelector("#filtroActividad");
const filtroLimite = document.querySelector("#filtroLimite");
const filtrosForm = document.querySelector("#filtrosResultados");

const resumenIntentos = document.querySelector("#resumenIntentos");
const resumenEstudiantes = document.querySelector("#resumenEstudiantes");
const resumenCompletados = document.querySelector("#resumenCompletados");
const resumenTiempo = document.querySelector("#resumenTiempo");

let filtrosCargados = false;

function obtenerToken() {
  return localStorage.getItem("docente_token");
}

function cerrarSesion() {
  localStorage.removeItem("docente_token");
  localStorage.removeItem("docente_usuario");
  window.location.href = "./login.html";
}

function construirUrlResultados() {
  const params = new URLSearchParams();

  params.set("anio_lectivo", "2026");
  params.set("limite", filtroLimite?.value || "200");

  if (filtroGrupo?.value) {
    params.set("grupo_id", filtroGrupo.value);
  }

  if (filtroActividad?.value) {
    params.set("juego_slug", filtroActividad.value);
  }

  return `${API_BASE_URL}/docente-resultados?${params.toString()}`;
}

async function cargarResultados() {
  const token = obtenerToken();

  if (!token) {
    cerrarSesion();
    return;
  }

  estado.textContent = "Cargando resultados...";

  try {
    const response = await fetch(construirUrlResultados(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "No se pudieron cargar los resultados.");
    }

    if (!filtrosCargados) {
      cargarOpcionesFiltros(data.opciones);
      filtrosCargados = true;
    }

    renderizarResumen(data.resumen);
    renderizarResultados(data.intentos);
  } catch (error) {
    console.error(error);
    estado.textContent = "No se pudieron cargar los resultados.";
  }
}

function cargarOpcionesFiltros(opciones) {
  if (!opciones) return;

  if (Array.isArray(opciones.grupos)) {
    for (const grupo of opciones.grupos) {
      const option = document.createElement("option");
      option.value = grupo.id;
      option.textContent = grupo.nombre;
      filtroGrupo.appendChild(option);
    }
  }

  if (Array.isArray(opciones.juegos)) {
    for (const juego of opciones.juegos) {
      const option = document.createElement("option");
      option.value = juego.slug;
      option.textContent = juego.titulo;
      filtroActividad.appendChild(option);
    }
  }
}

function renderizarResumen(resumen) {
  if (!resumen) return;

  resumenIntentos.textContent = resumen.total_intentos ?? "0";
  resumenEstudiantes.textContent = resumen.estudiantes_con_actividad ?? "0";
  resumenCompletados.textContent = `${resumen.completados ?? 0} / ${
    resumen.total_intentos ?? 0
  }`;
  resumenTiempo.textContent = resumen.promedio_tiempo ?? "0 min 0 s";
}

function renderizarResultados(intentos) {
  tablaBody.innerHTML = "";

  totalResultados.textContent = `${intentos.length} registros encontrados`;

  if (intentos.length === 0) {
    estado.textContent = "No hay resultados registrados con esos filtros.";
    return;
  }

  estado.textContent = "Resultados cargados correctamente.";

  for (const intento of intentos) {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${intento.grupo}</td>
      <td>${intento.estudiante}</td>
      <td>${intento.actividad}</td>
      <td>${intento.numero_intento}</td>
      <td>
        <strong>${intento.metrica_1_nombre}:</strong>
        ${intento.metrica_1_valor}
      </td>
      <td>
        <strong>${intento.metrica_2_nombre}:</strong>
        ${intento.metrica_2_valor}
      </td>
      <td>${intento.tiempo}</td>
      <td>${intento.resultado}</td>
    `;

    tablaBody.appendChild(fila);
  }
}

if (filtrosForm) {
  filtrosForm.addEventListener("submit", (event) => {
    event.preventDefault();
    cargarResultados();
  });
}

document.addEventListener("DOMContentLoaded", cargarResultados);
