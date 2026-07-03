const CONFIG = window.ALMACEN_CONFIG;

const grupoSelect = document.getElementById("grupoSelect");
const estudianteSelect = document.getElementById("estudianteSelect");
const btnEntrar = document.getElementById("btnEntrar");
const estadoIngreso = document.getElementById("estadoIngreso");

const panelIngreso = document.getElementById("panelIngreso");
const panelJuego = document.getElementById("panelJuego");
const nombreJugador = document.getElementById("nombreJugador");
const grupoJugador = document.getElementById("grupoJugador");

const btnIniciar = document.getElementById("btnIniciar");
const btnReiniciar = document.getElementById("btnReiniciar");
const btnSiguienteFase = document.getElementById("btnSiguienteFase");

const cronometro = document.getElementById("cronometro");
const objetivoTexto = document.getElementById("objetivoTexto");
const faseTexto = document.getElementById("faseTexto");
const faseDescripcion = document.getElementById("faseDescripcion");
const indicePanel = document.getElementById("indicePanel");
const indiceLista = document.getElementById("indiceLista");
const cajasGrid = document.getElementById("cajasGrid");
const revisionesFase1 = document.getElementById("revisionesFase1");
const revisionesFase2 = document.getElementById("revisionesFase2");
const ahorroTexto = document.getElementById("ahorroTexto");
const resultado = document.getElementById("resultado");
const historialBody = document.getElementById("historialBody");

let estudianteActual = null;
let grupoActual = null;

let intervalo = null;
let tiempo = 0;
let juegoEnCurso = false;
let juegoFinalizado = false;
let intentoGuardado = false;

let fase = 1;
let cajas = [];
let objetivo = null;
let objetivoCaja = null;
let totalFase1 = 0;
let totalFase2 = 0;
let historial = [];

const objetos = [
  "Adaptadores",
  "Auriculares",
  "Cables",
  "Calculadoras",
  "Cartulinas",
  "Cuadernos",
  "Extensiones",
  "Marcadores",
  "Mouse",
  "Notebooks",
  "Parlantes",
  "Pelotas",
  "Pendrives",
  "Pinceles",
  "Proyectores",
  "Reglas",
  "Routers",
  "Tizas",
  "Tijeras",
  "Webcams",
];

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);
  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnReiniciar.addEventListener("click", reiniciarJuego);
  btnSiguienteFase.addEventListener("click", comenzarFase2);

  actualizarPanel();
}

/* =========================
   CARGA DE DATOS
========================= */

async function cargarGrupos() {
  try {
    grupoSelect.innerHTML = `<option value="">Cargando grupos...</option>`;
    const response = await fetch(`${CONFIG.apiBaseUrl}/grupos`);
    if (!response.ok) throw new Error("No se pudieron cargar los grupos.");

    const grupos = await response.json();
    grupoSelect.innerHTML = `<option value="">Elegí tu grupo</option>`;

    grupos.forEach((grupo) => {
      const option = document.createElement("option");
      option.value = grupo.id;
      option.textContent = grupo.nombre;
      option.dataset.nombre = grupo.nombre;
      grupoSelect.appendChild(option);
    });

    estadoIngreso.textContent = "";
  } catch (error) {
    console.error(error);
    grupoSelect.innerHTML = `<option value="">No se pudieron cargar los grupos</option>`;
    estadoIngreso.textContent = "No se pudo conectar con la lista de grupos.";
  }
}

async function manejarCambioGrupo() {
  const grupoId = grupoSelect.value;
  const grupoNombre = grupoSelect.selectedOptions[0]?.dataset.nombre || "";

  estudianteActual = null;
  grupoActual = null;
  btnEntrar.disabled = true;

  if (!grupoId) {
    estudianteSelect.disabled = true;
    estudianteSelect.innerHTML = `<option value="">Primero elegí un grupo</option>`;
    return;
  }

  grupoActual = { id: Number(grupoId), nombre: grupoNombre };
  await cargarEstudiantes(grupoId);
}

async function cargarEstudiantes(grupoId) {
  try {
    estudianteSelect.disabled = true;
    estudianteSelect.innerHTML = `<option value="">Cargando estudiantes...</option>`;

    const response = await fetch(
      `${CONFIG.apiBaseUrl}/estudiantes?grupo_id=${grupoId}`,
    );
    if (!response.ok) throw new Error("No se pudieron cargar los estudiantes.");

    const estudiantes = await response.json();
    estudianteSelect.innerHTML = `<option value="">Elegí tu nombre</option>`;

    estudiantes.forEach((estudiante) => {
      const option = document.createElement("option");
      option.value = estudiante.id;
      option.textContent = estudiante.nombre_completo;
      option.dataset.nombre = estudiante.nombre_completo;
      option.dataset.inscripcionId = estudiante.inscripcion_id || "";
      estudianteSelect.appendChild(option);
    });

    estudianteSelect.disabled = false;
    estadoIngreso.textContent = "";
  } catch (error) {
    console.error(error);
    estudianteSelect.innerHTML = `<option value="">No se pudieron cargar estudiantes</option>`;
    estadoIngreso.textContent =
      "No se pudo conectar con la lista de estudiantes.";
  }
}

function manejarCambioEstudiante() {
  const estudianteId = estudianteSelect.value;

  if (!estudianteId || !grupoActual) {
    estudianteActual = null;
    btnEntrar.disabled = true;
    return;
  }

  const selected = estudianteSelect.selectedOptions[0];
  estudianteActual = {
    id: Number(estudianteId),
    nombre_completo: selected.dataset.nombre,
    inscripcion_id: selected.dataset.inscripcionId
      ? Number(selected.dataset.inscripcionId)
      : null,
  };

  btnEntrar.disabled = false;
}

/* =========================
   INGRESO
========================= */

async function entrarAlDesafio() {
  if (!estudianteActual || !grupoActual) return;

  btnEntrar.disabled = true;
  estadoIngreso.textContent = "Verificando disponibilidad e intentos...";

  try {
    const estado = await consultarEstadoIntento(estudianteActual.id);

    if (!estado.puede_jugar) {
      estadoIngreso.textContent = estado.motivo;
      return;
    }

    nombreJugador.textContent = estudianteActual.nombre_completo;
    grupoJugador.textContent = `Grupo: ${grupoActual.nombre}`;

    panelIngreso.classList.add("is-hidden");
    panelJuego.classList.remove("is-hidden");

    const layoutGame = document.querySelector(".layout-game");
    if (layoutGame) layoutGame.classList.add("solo-juego");

    resultado.className = "resultado";
    resultado.textContent = `Intentos usados: ${estado.intentos_realizados} de ${estado.max_intentos}. Te quedan ${estado.intentos_restantes}.`;
  } catch (error) {
    console.error(error);
    estadoIngreso.textContent =
      "No se pudo verificar la actividad. Avisá al docente.";
  } finally {
    btnEntrar.disabled = false;
  }
}

async function consultarEstadoIntento(estudianteId) {
  const url =
    `${CONFIG.apiBaseUrl}/estado-intento` +
    `?juego_slug=${CONFIG.juegoSlug}` +
    `&estudiante_id=${estudianteId}` +
    `&grupo_id=${grupoActual.id}`;

  const response = await fetch(url);
  if (!response.ok)
    throw new Error("No se pudo consultar el estado del intento.");
  return await response.json();
}

/* =========================
   JUEGO
========================= */

function iniciarJuego() {
  prepararDatos();
  fase = 1;
  totalFase1 = 0;
  totalFase2 = 0;
  historial = [];
  tiempo = 0;
  juegoEnCurso = true;
  juegoFinalizado = false;
  intentoGuardado = false;

  objetivoTexto.textContent = objetivo;
  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;
  btnSiguienteFase.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Fase 1: abrí cajas hasta encontrar el objeto. No hay índice todavía.";

  iniciarCronometro();
  renderizarIndice();
  renderizarCajas();
  actualizarPanel();
  renderizarHistorial();
}

function prepararDatos() {
  const elegidos = mezclar([...objetos]).slice(0, CONFIG.cantidadCajas);
  objetivo = elegidos[Math.floor(Math.random() * elegidos.length)];

  cajas = mezclar(elegidos).map((objeto, index) => ({
    numero: index + 1,
    objeto,
    abierta: false,
    descartada: false,
  }));

  objetivoCaja = cajas.find((caja) => caja.objeto === objetivo)?.numero;
}

function renderizarCajas() {
  cajasGrid.innerHTML = "";

  cajas.forEach((caja) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "caja-btn";
    button.dataset.numero = String(caja.numero);

    if (caja.abierta) button.classList.add("caja-abierta");
    if (caja.objeto === objetivo && caja.abierta)
      button.classList.add("caja-correcta");

    button.innerHTML = caja.abierta
      ? `<span>Caja ${String(caja.numero).padStart(2, "0")}</span><strong>${caja.objeto}</strong>`
      : `<span>Caja ${String(caja.numero).padStart(2, "0")}</span><strong>?</strong>`;

    button.disabled =
      !juegoEnCurso ||
      juegoFinalizado ||
      caja.abierta ||
      (fase === 1 &&
        totalFase1 > 0 &&
        cajas.find((c) => c.objeto === objetivo)?.abierta);
    button.addEventListener("click", () => revisarCaja(caja.numero));

    cajasGrid.appendChild(button);
  });
}

function revisarCaja(numeroCaja) {
  if (!juegoEnCurso || juegoFinalizado) return;

  const caja = cajas.find((item) => item.numero === numeroCaja);
  if (!caja || caja.abierta) return;

  caja.abierta = true;

  if (fase === 1) totalFase1++;
  if (fase === 2) totalFase2++;

  const encontro = caja.objeto === objetivo;

  historial.push({
    fase,
    caja: numeroCaja,
    contenido: caja.objeto,
    resultado: encontro ? "Encontrado" : "No era",
  });

  if (encontro && fase === 1) {
    resultado.className = "resultado ok";
    resultado.textContent = `Encontraste ${objetivo} en ${totalFase1} revisiones. Ahora probá con índice.`;
    btnSiguienteFase.disabled = false;
    bloquearCajas();
  } else if (encontro && fase === 2) {
    finalizarJuego();
  } else {
    resultado.className = "resultado warn";
    resultado.textContent = `No era ${caja.objeto}. Seguí buscando ${objetivo}.`;
  }

  actualizarPanel();
  renderizarCajas();
  renderizarHistorial();
}

function bloquearCajas() {
  cajas.forEach((caja) => {
    if (!caja.abierta) caja.descartada = true;
  });
}

function comenzarFase2() {
  fase = 2;
  btnSiguienteFase.disabled = true;

  cajas = cajas.map((caja) => ({
    ...caja,
    abierta: false,
    descartada: false,
  }));

  indicePanel.classList.remove("is-hidden");
  resultado.className = "resultado";
  resultado.textContent = `Fase 2: usá el índice. ${objetivo} figura en la caja ${String(objetivoCaja).padStart(2, "0")}.`;

  actualizarPanel();
  renderizarIndice();
  renderizarCajas();
}

function renderizarIndice() {
  indiceLista.innerHTML = "";

  const filas = cajas
    .map((caja) => ({ objeto: caja.objeto, caja: caja.numero }))
    .sort((a, b) => a.objeto.localeCompare(b.objeto, "es"));

  filas.forEach((fila) => {
    const item = document.createElement("div");
    item.className = "indice-item";
    if (fila.objeto === objetivo) item.classList.add("indice-destacado");
    item.innerHTML = `<span>${fila.objeto}</span><strong>Caja ${String(fila.caja).padStart(2, "0")}</strong>`;
    indiceLista.appendChild(item);
  });
}

async function finalizarJuego() {
  juegoFinalizado = true;
  juegoEnCurso = false;
  detenerCronometro();

  const ahorro = Math.max(totalFase1 - totalFase2, 0);
  resultado.className = "resultado ok";
  resultado.textContent = `Encontraste el objeto usando índice. Sin índice: ${totalFase1} revisiones. Con índice: ${totalFase2}. Ahorro: ${ahorro}.`;

  actualizarPanel();
  renderizarCajas();
  renderizarHistorial();
  await guardarIntento();
}

function reiniciarJuego() {
  detenerCronometro();
  fase = 1;
  cajas = [];
  objetivo = null;
  objetivoCaja = null;
  totalFase1 = 0;
  totalFase2 = 0;
  historial = [];
  tiempo = 0;
  juegoEnCurso = false;
  juegoFinalizado = false;
  intentoGuardado = false;

  btnIniciar.disabled = false;
  btnReiniciar.disabled = true;
  btnSiguienteFase.disabled = true;
  indicePanel.classList.add("is-hidden");
  objetivoTexto.textContent = "---";
  cajasGrid.innerHTML = "";
  resultado.className = "resultado";
  resultado.textContent =
    "Reiniciado. Presioná Iniciar misión para jugar otra vez.";
  cronometro.textContent = "00:00";

  actualizarPanel();
  renderizarHistorial();
}

function actualizarPanel() {
  revisionesFase1.textContent = String(totalFase1);
  revisionesFase2.textContent = String(totalFase2);

  if (fase === 1) {
    faseTexto.textContent = "Fase 1: almacén desordenado";
    faseDescripcion.textContent =
      "Abrí cajas hasta encontrar el objeto. Cada caja abierta cuenta como una revisión.";
    ahorroTexto.textContent = "---";
  } else {
    faseTexto.textContent = "Fase 2: almacén con índice";
    faseDescripcion.textContent =
      "Usá el índice alfabético para encontrar la caja correcta con menos revisiones.";
    ahorroTexto.textContent =
      totalFase2 > 0 ? String(Math.max(totalFase1 - totalFase2, 0)) : "---";
  }
}

function renderizarHistorial() {
  if (historial.length === 0) {
    historialBody.innerHTML = `<tr><td colspan="5">Todavía no hay revisiones.</td></tr>`;
    return;
  }

  historialBody.innerHTML = "";
  historial.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>Fase ${item.fase}</td>
      <td>Caja ${String(item.caja).padStart(2, "0")}</td>
      <td>${item.contenido}</td>
      <td>${item.resultado}</td>
    `;
    historialBody.appendChild(row);
  });
}

/* =========================
   CRONÓMETRO Y GUARDADO
========================= */

function iniciarCronometro() {
  detenerCronometro();
  tiempo = 0;
  cronometro.textContent = "00:00";
  intervalo = setInterval(() => {
    tiempo++;
    cronometro.textContent = formatearTiempo(tiempo);
  }, 1000);
}

function detenerCronometro() {
  if (intervalo) clearInterval(intervalo);
  intervalo = null;
}

function formatearTiempo(segundos) {
  const min = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const sec = (segundos % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

async function guardarIntento() {
  if (intentoGuardado || !estudianteActual || !grupoActual) return;
  intentoGuardado = true;

  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/intentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        juego_slug: CONFIG.juegoSlug,
        estudiante_id: estudianteActual.id,
        grupo_id: grupoActual.id,
        inscripcion_id: estudianteActual.inscripcion_id,
        total_intercambios: totalFase1,
        total_adivinanzas: totalFase2,
        tiempo_total_segundos: tiempo,
        completado: true,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      resultado.className = "resultado error";
      resultado.textContent = data.error || "No se pudo guardar el intento.";
      return;
    }

    resultado.textContent += ` Intento guardado: ${data.intentos_realizados} de ${data.max_intentos}.`;
  } catch (error) {
    console.error(error);
    resultado.className = "resultado error";
    resultado.textContent =
      "El intento terminó, pero no se pudo guardar. Avisá al docente.";
  }
}

function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
