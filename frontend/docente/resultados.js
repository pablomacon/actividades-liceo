const API_BASE_URL = "https://backend-actividades-liceo.vercel.app/api";

const tablaBody = document.querySelector("#tablaResultados tbody");
const estado = document.querySelector("#estadoResultados");
const totalResultados = document.querySelector("#totalResultados");

function obtenerToken() {
  return localStorage.getItem("docente_token");
}

function cerrarSesion() {
  localStorage.removeItem("docente_token");
  localStorage.removeItem("docente_usuario");
  window.location.href = "./login.html";
}

async function cargarResultados() {
  const token = obtenerToken();

  if (!token) {
    cerrarSesion();
    return;
  }

  estado.textContent = "Cargando resultados...";

  try {
    const response = await fetch(
      `${API_BASE_URL}/docente-resultados?anio_lectivo=2026&limite=200`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "No se pudieron cargar los resultados.");
    }

    renderizarResultados(data.intentos);
  } catch (error) {
    console.error(error);
    estado.textContent = "No se pudieron cargar los resultados.";
  }
}

function renderizarResultados(intentos) {
  tablaBody.innerHTML = "";

  totalResultados.textContent = `${intentos.length} registros encontrados`;

  if (intentos.length === 0) {
    estado.textContent = "No hay resultados registrados todavía.";
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

document.addEventListener("DOMContentLoaded", cargarResultados);