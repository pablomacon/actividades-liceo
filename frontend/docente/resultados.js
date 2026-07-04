const API_BASE_URL = "https://backend-actividades-liceo.vercel.app/api";

/* =========================================================
   ELEMENTOS: RESULTADOS
========================================================= */

const tablaBody = document.querySelector("#tablaResultados tbody");
const estadoResultados = document.getElementById("estadoResultados");
const totalResultados = document.getElementById("totalResultados");

const filtroGrupo = document.getElementById("filtroGrupo");
const filtroActividad = document.getElementById("filtroActividad");
const filtroLimite = document.getElementById("filtroLimite");
const filtrosForm = document.getElementById("filtrosResultados");

const resumenIntentos = document.getElementById("resumenIntentos");
const resumenEstudiantes = document.getElementById("resumenEstudiantes");
const resumenCompletados = document.getElementById("resumenCompletados");
const resumenTiempo = document.getElementById("resumenTiempo");

/* =========================================================
   ELEMENTOS: HABILITACIONES
========================================================= */

const listaGruposHabilitaciones = document.getElementById(
  "listaGruposHabilitaciones",
);

const listaActividadesHabilitaciones = document.getElementById(
  "listaActividadesHabilitaciones",
);

const seleccionarTodosGrupos = document.getElementById(
  "seleccionarTodosGrupos",
);

const seleccionarTodasActividades = document.getElementById(
  "seleccionarTodasActividades",
);

const btnHabilitar = document.getElementById("btnHabilitar");
const btnDeshabilitar = document.getElementById("btnDeshabilitar");

const btnActualizarHabilitaciones = document.getElementById(
  "btnActualizarHabilitaciones",
);

const estadoHabilitaciones = document.getElementById("estadoHabilitaciones");

const encabezadoTablaHabilitaciones = document.getElementById(
  "encabezadoTablaHabilitaciones",
);

const cuerpoTablaHabilitaciones = document.getElementById(
  "cuerpoTablaHabilitaciones",
);

/* =========================================================
   ESTADO LOCAL
========================================================= */

let filtrosResultadosCargados = false;

let gruposHabilitaciones = [];
let juegosHabilitaciones = [];
let habilitacionesActuales = [];

let modificandoHabilitaciones = false;

/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  configurarEventos();
  cargarResultados();
  cargarHabilitaciones();
});

function configurarEventos() {
  if (filtrosForm) {
    filtrosForm.addEventListener("submit", (event) => {
      event.preventDefault();
      cargarResultados();
    });
  }

  if (seleccionarTodosGrupos) {
    seleccionarTodosGrupos.addEventListener("change", () => {
      marcarTodos(
        ".checkbox-grupo-habilitacion",
        seleccionarTodosGrupos.checked,
      );

      actualizarCheckboxTodosGrupos();
    });
  }

  if (seleccionarTodasActividades) {
    seleccionarTodasActividades.addEventListener("change", () => {
      marcarTodos(
        ".checkbox-actividad-habilitacion",
        seleccionarTodasActividades.checked,
      );

      actualizarCheckboxTodasActividades();
    });
  }

  if (btnHabilitar) {
    btnHabilitar.addEventListener("click", () => {
      modificarHabilitaciones(true);
    });
  }

  if (btnDeshabilitar) {
    btnDeshabilitar.addEventListener("click", () => {
      modificarHabilitaciones(false);
    });
  }

  if (btnActualizarHabilitaciones) {
    btnActualizarHabilitaciones.addEventListener("click", cargarHabilitaciones);
  }
}

/* =========================================================
   AUTENTICACIÓN
========================================================= */

function obtenerToken() {
  return localStorage.getItem("docente_token");
}

function obtenerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem("docente_usuario") || "null");
  } catch {
    return null;
  }
}

function cerrarSesion() {
  localStorage.removeItem("docente_token");
  localStorage.removeItem("docente_usuario");
  window.location.href = "./login.html";
}

function verificarPermisosEdicion() {
  const usuario = obtenerUsuarioGuardado();
  const esAdmin = usuario?.rol === "admin";

  if (btnHabilitar) {
    btnHabilitar.disabled = modificandoHabilitaciones || !esAdmin;
  }

  if (btnDeshabilitar) {
    btnDeshabilitar.disabled = modificandoHabilitaciones || !esAdmin;
  }

  if (!esAdmin && estadoHabilitaciones) {
    estadoHabilitaciones.className = "mensaje aviso";
    estadoHabilitaciones.textContent =
      "Podés consultar las habilitaciones, pero solo el rol administrador puede modificarlas.";
  }

  return esAdmin;
}

/* =========================================================
   RESULTADOS
========================================================= */

function construirUrlResultados() {
  const parametros = new URLSearchParams();

  parametros.set("anio_lectivo", "2026");
  parametros.set("limite", filtroLimite?.value || "200");

  if (filtroGrupo?.value) {
    parametros.set("grupo_id", filtroGrupo.value);
  }

  if (filtroActividad?.value) {
    parametros.set("juego_slug", filtroActividad.value);
  }

  return `${API_BASE_URL}/docente-resultados?${parametros.toString()}`;
}

async function cargarResultados() {
  const token = obtenerToken();

  if (!token) {
    cerrarSesion();
    return;
  }

  mostrarEstadoResultados("Consultando resultados...", "estado-ok");

  try {
    const response = await fetch(construirUrlResultados(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      cerrarSesion();
      return;
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "No se pudieron cargar los resultados.");
    }

    if (!filtrosResultadosCargados) {
      cargarOpcionesFiltros(data.opciones || {});
      filtrosResultadosCargados = true;
    }

    renderizarResumen(data.resumen || {});
    renderizarResultados(data.intentos || []);

    mostrarEstadoResultados(
      "Resultados actualizados correctamente.",
      "estado-ok",
    );
  } catch (error) {
    console.error("Error al cargar resultados:", error);

    mostrarEstadoResultados(
      error.message || "No se pudieron cargar los resultados.",
      "estado-error",
    );

    renderizarResumen({});
    renderizarResultados([]);
  }
}

function cargarOpcionesFiltros(opciones) {
  if (filtroGrupo) {
    const valorActual = filtroGrupo.value;

    filtroGrupo.innerHTML = `<option value="">Todos los grupos</option>`;

    (opciones.grupos || []).forEach((grupo) => {
      const option = document.createElement("option");
      option.value = String(grupo.id);
      option.textContent = grupo.nombre;
      filtroGrupo.appendChild(option);
    });

    filtroGrupo.value = valorActual;
  }

  if (filtroActividad) {
    const valorActual = filtroActividad.value;

    filtroActividad.innerHTML = `<option value="">Todas las actividades</option>`;

    (opciones.juegos || []).forEach((juego) => {
      const option = document.createElement("option");
      option.value = juego.slug;
      option.textContent = juego.titulo;
      filtroActividad.appendChild(option);
    });

    filtroActividad.value = valorActual;
  }
}

function renderizarResumen(resumen) {
  if (resumenIntentos) {
    resumenIntentos.textContent = resumen.total_intentos ?? "0";
  }

  if (resumenEstudiantes) {
    resumenEstudiantes.textContent = resumen.estudiantes_con_actividad ?? "0";
  }

  if (resumenCompletados) {
    const completados = resumen.completados ?? 0;
    const total = resumen.total_intentos ?? 0;

    resumenCompletados.textContent = `${completados} / ${total}`;
  }

  if (resumenTiempo) {
    resumenTiempo.textContent = resumen.promedio_tiempo ?? "0 min 0 s";
  }
}

function renderizarResultados(intentos) {
  if (!tablaBody) return;

  tablaBody.innerHTML = "";

  if (totalResultados) {
    totalResultados.textContent = `${intentos.length} registros encontrados`;
  }

  if (intentos.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="8">
          No hay resultados para los filtros seleccionados.
        </td>
      </tr>
    `;

    return;
  }

  intentos.forEach((intento) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${escapeHTML(intento.grupo || "—")}</td>
      <td>${escapeHTML(intento.estudiante || "—")}</td>
      <td>${escapeHTML(intento.actividad || "—")}</td>
      <td>${escapeHTML(String(intento.numero_intento ?? "—"))}</td>

      <td>
        <strong>${escapeHTML(intento.metrica_1_nombre || "Métrica 1")}:</strong>
        ${escapeHTML(String(intento.metrica_1_valor ?? "—"))}
      </td>

      <td>
        <strong>${escapeHTML(intento.metrica_2_nombre || "Métrica 2")}:</strong>
        ${escapeHTML(String(intento.metrica_2_valor ?? "—"))}
      </td>

      <td>${escapeHTML(intento.tiempo || "—")}</td>

      <td>
        <span class="estado-resultado">
          ${escapeHTML(intento.resultado || "—")}
        </span>
      </td>
    `;

    tablaBody.appendChild(fila);
  });
}

function mostrarEstadoResultados(mensaje, clase) {
  if (!estadoResultados) return;

  estadoResultados.className = clase;
  estadoResultados.textContent = mensaje;
}

/* =========================================================
   CARGA DE HABILITACIONES
========================================================= */

async function cargarHabilitaciones() {
  const token = obtenerToken();

  if (!token) {
    cerrarSesion();
    return;
  }

  mostrarEstadoHabilitaciones(
    "Consultando grupos, actividades y habilitaciones...",
    "mensaje aviso",
  );

  bloquearControlesHabilitaciones(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/docente-habilitaciones?anio_lectivo=2026`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      cerrarSesion();
      return;
    }

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error || "No se pudieron cargar las habilitaciones.",
      );
    }

    gruposHabilitaciones = Array.isArray(data.grupos) ? data.grupos : [];

    juegosHabilitaciones = Array.isArray(data.juegos) ? data.juegos : [];

    habilitacionesActuales = Array.isArray(data.habilitaciones)
      ? data.habilitaciones
      : [];

    renderizarSeleccionGrupos();
    renderizarSeleccionActividades();
    renderizarTablaHabilitaciones();

    const esAdmin = verificarPermisosEdicion();

    if (esAdmin) {
      mostrarEstadoHabilitaciones(
        "Estado actualizado. Seleccioná grupos y actividades para modificar su disponibilidad.",
        "mensaje exito",
      );
    }
  } catch (error) {
    console.error("Error al cargar habilitaciones:", error);

    mostrarEstadoHabilitaciones(
      error.message || "No se pudieron cargar las habilitaciones.",
      "mensaje error",
    );

    mostrarErrorEnListas();
  } finally {
    bloquearControlesHabilitaciones(false);
    verificarPermisosEdicion();
  }
}

function renderizarSeleccionGrupos() {
  if (!listaGruposHabilitaciones) return;

  listaGruposHabilitaciones.innerHTML = "";

  if (gruposHabilitaciones.length === 0) {
    listaGruposHabilitaciones.innerHTML = `<p class="texto-secundario">No hay grupos disponibles.</p>`;

    return;
  }

  gruposHabilitaciones.forEach((grupo) => {
    const label = document.createElement("label");
    label.className = "checkbox-item";

    label.innerHTML = `
      <input
        type="checkbox"
        class="checkbox-grupo-habilitacion"
        value="${escapeHTML(String(grupo.id))}"
      />
      <span>${escapeHTML(grupo.nombre)}</span>
    `;

    listaGruposHabilitaciones.appendChild(label);
  });

  document
    .querySelectorAll(".checkbox-grupo-habilitacion")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", actualizarCheckboxTodosGrupos);
    });

  if (seleccionarTodosGrupos) {
    seleccionarTodosGrupos.checked = false;
    seleccionarTodosGrupos.indeterminate = false;
  }
}

function renderizarSeleccionActividades() {
  if (!listaActividadesHabilitaciones) return;

  listaActividadesHabilitaciones.innerHTML = "";

  if (juegosHabilitaciones.length === 0) {
    listaActividadesHabilitaciones.innerHTML = `<p class="texto-secundario">No hay actividades disponibles.</p>`;

    return;
  }

  juegosHabilitaciones.forEach((juego) => {
    const label = document.createElement("label");

    label.className = "checkbox-item checkbox-actividad-item";

    label.innerHTML = `
      <input
        type="checkbox"
        class="checkbox-actividad-habilitacion"
        value="${escapeHTML(String(juego.id))}"
      />

      <span>
        <strong>${escapeHTML(juego.titulo)}</strong>
        <small>${escapeHTML(juego.categoria || "")}</small>
      </span>
    `;

    listaActividadesHabilitaciones.appendChild(label);
  });

  document
    .querySelectorAll(".checkbox-actividad-habilitacion")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", actualizarCheckboxTodasActividades);
    });

  if (seleccionarTodasActividades) {
    seleccionarTodasActividades.checked = false;
    seleccionarTodasActividades.indeterminate = false;
  }
}

function renderizarTablaHabilitaciones() {
  if (!encabezadoTablaHabilitaciones || !cuerpoTablaHabilitaciones) {
    return;
  }

  encabezadoTablaHabilitaciones.innerHTML = `<th>Actividad</th>`;

  gruposHabilitaciones.forEach((grupo) => {
    const th = document.createElement("th");
    th.textContent = grupo.nombre;
    encabezadoTablaHabilitaciones.appendChild(th);
  });

  cuerpoTablaHabilitaciones.innerHTML = "";

  if (juegosHabilitaciones.length === 0) {
    cuerpoTablaHabilitaciones.innerHTML = `
      <tr>
        <td colspan="${gruposHabilitaciones.length + 1}">
          No hay actividades disponibles.
        </td>
      </tr>
    `;

    return;
  }

  const mapaHabilitaciones = crearMapaHabilitaciones();

  juegosHabilitaciones.forEach((juego) => {
    const fila = document.createElement("tr");
    const celdaActividad = document.createElement("td");

    celdaActividad.innerHTML = `
      <strong>${escapeHTML(juego.titulo)}</strong>
      <small class="actividad-slug">
        ${escapeHTML(juego.slug)}
      </small>
    `;

    fila.appendChild(celdaActividad);

    gruposHabilitaciones.forEach((grupo) => {
      const clave = crearClaveHabilitacion(juego.id, grupo.id);

      const habilitacion = mapaHabilitaciones.get(clave);

      const habilitada =
        juego.activo === true && habilitacion?.habilitado === true;

      const celda = document.createElement("td");

      celda.className = "celda-estado-habilitacion";

      celda.innerHTML = `
        <span class="badge-habilitacion ${
          habilitada ? "badge-habilitada" : "badge-deshabilitada"
        }">
          ${habilitada ? "Habilitada" : "Cerrada"}
        </span>
      `;

      fila.appendChild(celda);
    });

    cuerpoTablaHabilitaciones.appendChild(fila);
  });
}

function crearMapaHabilitaciones() {
  const mapa = new Map();

  habilitacionesActuales.forEach((habilitacion) => {
    const clave = crearClaveHabilitacion(
      habilitacion.juego_id,
      habilitacion.grupo_id,
    );

    mapa.set(clave, habilitacion);
  });

  return mapa;
}

function crearClaveHabilitacion(juegoId, grupoId) {
  return `${String(juegoId)}:${String(grupoId)}`;
}

/* =========================================================
   MODIFICACIÓN DE HABILITACIONES
========================================================= */

async function modificarHabilitaciones(habilitado) {
  if (modificandoHabilitaciones) return;

  const usuario = obtenerUsuarioGuardado();

  if (usuario?.rol !== "admin") {
    mostrarEstadoHabilitaciones(
      "Solo el rol administrador puede modificar habilitaciones.",
      "mensaje error",
    );

    return;
  }

  const grupoIds = obtenerSeleccionados(".checkbox-grupo-habilitacion");

  const juegoIds = obtenerSeleccionados(".checkbox-actividad-habilitacion");

  if (grupoIds.length === 0) {
    mostrarEstadoHabilitaciones(
      "Seleccioná al menos un grupo.",
      "mensaje error",
    );

    return;
  }

  if (juegoIds.length === 0) {
    mostrarEstadoHabilitaciones(
      "Seleccioná al menos una actividad.",
      "mensaje error",
    );

    return;
  }

  const accion = habilitado ? "habilitar" : "deshabilitar";

  const confirmacion = window.confirm(
    `¿Confirmás que querés ${accion} ${juegoIds.length} actividad(es) para ${grupoIds.length} grupo(s)?`,
  );

  if (!confirmacion) return;

  modificandoHabilitaciones = true;
  bloquearControlesHabilitaciones(true);

  mostrarEstadoHabilitaciones(
    habilitado ? "Habilitando actividades..." : "Deshabilitando actividades...",
    "mensaje aviso",
  );

  try {
    const token = obtenerToken();

    const response = await fetch(`${API_BASE_URL}/docente-habilitaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        anio_lectivo: 2026,
        grupo_ids: grupoIds,
        juego_ids: juegoIds,
        habilitado,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      cerrarSesion();
      return;
    }

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error || "No se pudieron modificar las habilitaciones.",
      );
    }

    gruposHabilitaciones = Array.isArray(data.grupos)
      ? data.grupos
      : gruposHabilitaciones;

    juegosHabilitaciones = Array.isArray(data.juegos)
      ? data.juegos
      : juegosHabilitaciones;

    habilitacionesActuales = Array.isArray(data.habilitaciones)
      ? data.habilitaciones
      : habilitacionesActuales;

    renderizarTablaHabilitaciones();

    mostrarEstadoHabilitaciones(
      data.mensaje || "Habilitaciones actualizadas correctamente.",
      "mensaje exito",
    );

    limpiarSeleccionHabilitaciones();
  } catch (error) {
    console.error("Error al modificar habilitaciones:", error);

    mostrarEstadoHabilitaciones(
      error.message || "No se pudieron modificar las habilitaciones.",
      "mensaje error",
    );
  } finally {
    modificandoHabilitaciones = false;
    bloquearControlesHabilitaciones(false);
    verificarPermisosEdicion();
  }
}

/* =========================================================
   SELECCIONES
========================================================= */

function obtenerSeleccionados(selector) {
  return Array.from(document.querySelectorAll(`${selector}:checked`))
    .map((checkbox) => Number(checkbox.value))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function marcarTodos(selector, marcado) {
  document.querySelectorAll(selector).forEach((checkbox) => {
    checkbox.checked = marcado;
  });
}

function actualizarCheckboxTodosGrupos() {
  actualizarCheckboxGeneral(
    seleccionarTodosGrupos,
    ".checkbox-grupo-habilitacion",
  );
}

function actualizarCheckboxTodasActividades() {
  actualizarCheckboxGeneral(
    seleccionarTodasActividades,
    ".checkbox-actividad-habilitacion",
  );
}

function actualizarCheckboxGeneral(checkboxGeneral, selectorItems) {
  if (!checkboxGeneral) return;

  const items = Array.from(document.querySelectorAll(selectorItems));

  const seleccionados = items.filter((item) => item.checked).length;

  checkboxGeneral.checked = items.length > 0 && seleccionados === items.length;

  checkboxGeneral.indeterminate =
    seleccionados > 0 && seleccionados < items.length;
}

function limpiarSeleccionHabilitaciones() {
  marcarTodos(".checkbox-grupo-habilitacion", false);

  marcarTodos(".checkbox-actividad-habilitacion", false);

  if (seleccionarTodosGrupos) {
    seleccionarTodosGrupos.checked = false;
    seleccionarTodosGrupos.indeterminate = false;
  }

  if (seleccionarTodasActividades) {
    seleccionarTodasActividades.checked = false;
    seleccionarTodasActividades.indeterminate = false;
  }
}

/* =========================================================
   ESTADOS Y BLOQUEOS
========================================================= */

function bloquearControlesHabilitaciones(bloquear) {
  const controles = [
    seleccionarTodosGrupos,
    seleccionarTodasActividades,
    btnHabilitar,
    btnDeshabilitar,
    btnActualizarHabilitaciones,
  ];

  controles.forEach((control) => {
    if (control) {
      control.disabled = bloquear;
    }
  });

  document
    .querySelectorAll(
      ".checkbox-grupo-habilitacion, .checkbox-actividad-habilitacion",
    )
    .forEach((checkbox) => {
      checkbox.disabled = bloquear;
    });
}

function mostrarEstadoHabilitaciones(mensaje, clase) {
  if (!estadoHabilitaciones) return;

  estadoHabilitaciones.className = clase;
  estadoHabilitaciones.textContent = mensaje;
}

function mostrarErrorEnListas() {
  if (listaGruposHabilitaciones) {
    listaGruposHabilitaciones.innerHTML = `<p class="texto-secundario">No se pudieron cargar los grupos.</p>`;
  }

  if (listaActividadesHabilitaciones) {
    listaActividadesHabilitaciones.innerHTML = `<p class="texto-secundario">No se pudieron cargar las actividades.</p>`;
  }

  if (cuerpoTablaHabilitaciones) {
    cuerpoTablaHabilitaciones.innerHTML = `
      <tr>
        <td>No se pudo cargar el estado actual.</td>
      </tr>
    `;
  }
}

/* =========================================================
   UTILIDADES
========================================================= */

function escapeHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
