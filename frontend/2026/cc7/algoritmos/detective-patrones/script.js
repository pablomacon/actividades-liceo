const CONFIG = window.DETECTIVE_CONFIG;

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
const btnNuevaRonda = document.getElementById("btnNuevaRonda");

const cronometro = document.getElementById("cronometro");
const puntajeTexto = document.getElementById("puntajeTexto");
const rondaTexto = document.getElementById("rondaTexto");
const faseDescripcion = document.getElementById("faseDescripcion");
const pistasLista = document.getElementById("pistasLista");
const personajesGrid = document.getElementById("personajesGrid");
const acusacionesTexto = document.getElementById("acusacionesTexto");
const activosTexto = document.getElementById("activosTexto");
const descartadosTexto = document.getElementById("descartadosTexto");
const resultado = document.getElementById("resultado");
const historialBody = document.getElementById("historialBody");

let estudianteActual = null;
let grupoActual = null;

let intervalo = null;
let tiempo = 0;
let juegoEnCurso = false;
let juegoFinalizado = false;
let intentoGuardado = false;

let personajes = [];
let saboteadorId = null;
let tecnicoId = null;

let rondaActual = 0;
let acusaciones = 0;
let puntajeActual = 100;
let puedeAcusar = false;

let historial = [];

const puntajes = [100, 90, 70, 50, 30, 10, 0];
const pistasMinimasParaAcusar = 2;

const nombresBase = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elena",
  "Facundo",
  "Gabriela",
  "Hugo",
  "Inés",
  "Joaquín",
];

const avatares = ["🧩", "🔎", "💡", "🛠️", "📦", "🧭", "🔐", "📡", "🧪", "⚙️"];

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);
  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnReiniciar.addEventListener("click", reiniciarJuego);
  btnNuevaRonda.addEventListener("click", generarNuevaRonda);

  actualizarPanel();
  renderizarHistorial();
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
  prepararPersonajes();

  rondaActual = 0;
  acusaciones = 0;
  puntajeActual = puntajes[0];
  tiempo = 0;
  historial = [];

  juegoEnCurso = true;
  juegoFinalizado = false;
  intentoGuardado = false;
  puedeAcusar = false;

  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;
  btnNuevaRonda.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Primero vas a reunir pistas. No se puede acusar hasta tener al menos dos pistas.";

  iniciarCronometro();
  generarNuevaRonda();
  actualizarPanel();
  renderizarPersonajes();
  renderizarPistas();
  renderizarHistorial();
}

function prepararPersonajes() {
  const cantidad = CONFIG.cantidadPersonajes || 8;
  const nombresElegidos = mezclar([...nombresBase]).slice(0, cantidad);

  personajes = nombresElegidos.map((nombre, index) => ({
    id: index + 1,
    nombre,
    avatar: avatares[index] || "🔎",
    rol: "equipo",
    fuera: false,
    atacadoAlgunaVez: false,
    ultimoEstado: "",
  }));

  const indices = mezclar(personajes.map((personaje) => personaje.id));
  saboteadorId = indices[0];
  tecnicoId = indices[1];

  personajes = personajes.map((personaje) => {
    if (personaje.id === saboteadorId)
      return { ...personaje, rol: "saboteador" };
    if (personaje.id === tecnicoId) return { ...personaje, rol: "tecnico" };
    return personaje;
  });

  personajes = mezclar(personajes);
}

function generarNuevaRonda() {
  if (!juegoEnCurso || juegoFinalizado) return;

  limpiarEstadosVisuales();

  rondaActual++;

  const activos = personajes.filter((personaje) => !personaje.fuera);
  const posiblesAtacados = activos.filter(
    (personaje) => personaje.id !== saboteadorId,
  );

  if (posiblesAtacados.length === 0) {
    finalizarJuego(
      false,
      "Ya no quedan pistas suficientes. El Saboteador logró escapar.",
    );
    return;
  }

  const atacado = elegirAleatorio(posiblesAtacados);
  const protegido = elegirProtegido(activos);
  const ataqueProtegido = atacado.id === protegido.id;

  atacado.atacadoAlgunaVez = true;
  atacado.ultimoEstado = "atacado";
  protegido.ultimoEstado = "protegido";

  let resultadoRonda = "";

  if (ataqueProtegido) {
    resultadoRonda =
      "El Técnico evitó el sabotaje. Nadie quedó fuera de la investigación.";
  } else {
    atacado.fuera = true;
    atacado.ultimoEstado = "fuera";
    resultadoRonda = `${atacado.nombre} quedó fuera de la investigación.`;
  }

  historial.push({
    ronda: rondaActual,
    atacado: atacado.nombre,
    protegido: protegido.nombre,
    resultado: resultadoRonda,
    acusacion: "Pendiente",
    acierto: null,
  });

  puedeAcusar = rondaActual >= pistasMinimasParaAcusar;

  if (puedeAcusar) {
    btnNuevaRonda.disabled = true;
    resultado.className = "resultado";
    resultado.textContent =
      "Ya tenés al menos dos pistas. Revisá el historial y elegí un sospechoso.";
  } else {
    btnNuevaRonda.disabled = false;
    resultado.className = "resultado warn";
    resultado.textContent =
      "Primera pista registrada. Todavía no acuses: pedí una nueva ronda para juntar más información.";
  }

  actualizarPanel();
  renderizarPersonajes();
  renderizarPistas();
  renderizarHistorial();
}

function elegirProtegido(activos) {
  const tecnico = personajes.find((personaje) => personaje.id === tecnicoId);

  if (tecnico && !tecnico.fuera && Math.random() < 0.5) {
    return tecnico;
  }

  return elegirAleatorio(activos);
}

function manejarAcusacion(personajeId) {
  if (!juegoEnCurso || juegoFinalizado || !puedeAcusar) return;

  const personaje = personajes.find((item) => item.id === personajeId);
  if (!personaje || personaje.fuera) return;

  puedeAcusar = false;
  acusaciones++;

  const acerto = personaje.id === saboteadorId;
  const ultimaRonda = historial[historial.length - 1];

  if (ultimaRonda) {
    ultimaRonda.acusacion = personaje.nombre;
    ultimaRonda.acierto = acerto;
  }

  if (acerto) {
    personaje.ultimoEstado = "acierto";
    finalizarJuego(
      true,
      `Correcto: ${personaje.nombre} era el Saboteador. Puntaje final: ${puntajeActual}.`,
    );
    return;
  }

  personaje.ultimoEstado = "incorrecto";
  puntajeActual = puntajes[Math.min(acusaciones, puntajes.length - 1)];

  if (puntajeActual <= 0 || acusaciones >= puntajes.length - 1) {
    finalizarJuego(
      false,
      `No era ${personaje.nombre}. El Saboteador era ${obtenerNombreSaboteador()}. Puntaje final: 0.`,
    );
    return;
  }

  resultado.className = "resultado warn";
  resultado.textContent =
    `No era ${personaje.nombre}. Puntaje actual: ${puntajeActual}. ` +
    "Presioná “Nueva ronda” para recibir otra pista.";

  btnNuevaRonda.disabled = false;

  actualizarPanel();
  renderizarPersonajes();
  renderizarPistas();
  renderizarHistorial();
}

async function finalizarJuego(descubrioSaboteador, mensaje) {
  juegoFinalizado = true;
  juegoEnCurso = false;
  puedeAcusar = false;
  detenerCronometro();

  btnNuevaRonda.disabled = true;
  btnReiniciar.disabled = false;

  resultado.className = descubrioSaboteador
    ? "resultado ok"
    : "resultado error";
  resultado.textContent = mensaje;

  revelarSaboteador(descubrioSaboteador);
  actualizarPanel();
  renderizarPersonajes();
  renderizarPistas();
  renderizarHistorial();

  await guardarIntento(descubrioSaboteador);
}

function reiniciarJuego() {
  detenerCronometro();

  personajes = [];
  saboteadorId = null;
  tecnicoId = null;

  rondaActual = 0;
  acusaciones = 0;
  puntajeActual = puntajes[0];
  tiempo = 0;
  historial = [];

  juegoEnCurso = false;
  juegoFinalizado = false;
  intentoGuardado = false;
  puedeAcusar = false;

  btnIniciar.disabled = false;
  btnReiniciar.disabled = true;
  btnNuevaRonda.disabled = true;

  cronometro.textContent = "00:00";
  resultado.className = "resultado";
  resultado.textContent =
    "Reiniciado. Presioná Iniciar misión para jugar otra vez.";

  personajesGrid.innerHTML = "";
  pistasLista.innerHTML = `<p>Todavía no hay pistas. Presioná “Iniciar misión”.</p>`;

  actualizarPanel();
  renderizarHistorial();
}

function actualizarPanel() {
  puntajeTexto.textContent = String(puntajeActual);
  rondaTexto.textContent = rondaActual > 0 ? `Ronda ${rondaActual}` : "Ronda 1";
  acusacionesTexto.textContent = String(acusaciones);

  const activos = personajes.filter((personaje) => !personaje.fuera).length;
  const descartados = personajes.filter(
    (personaje) => personaje.atacadoAlgunaVez,
  ).length;

  activosTexto.textContent = String(activos);
  descartadosTexto.textContent = String(descartados);

  if (juegoFinalizado) {
    faseDescripcion.textContent =
      "Misión finalizada. Revisá el historial para ver cómo se fue reduciendo la búsqueda.";
  } else if (puedeAcusar) {
    faseDescripcion.textContent =
      "Ya podés acusar. Revisá las pistas acumuladas antes de elegir.";
  } else if (juegoEnCurso) {
    faseDescripcion.textContent =
      "Necesitás al menos dos pistas antes de acusar. Presioná “Nueva ronda”.";
  } else {
    faseDescripcion.textContent =
      "Leé las pistas acumuladas antes de acusar. Tenés una acusación por ronda.";
  }
}

function renderizarPersonajes() {
  personajesGrid.innerHTML = "";

  if (personajes.length === 0) {
    personajesGrid.innerHTML = `<p class="muted">Todavía no hay sospechosos. Iniciá la misión.</p>`;
    return;
  }

  personajes.forEach((personaje) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "personaje-btn";
    button.dataset.id = String(personaje.id);

    if (personaje.fuera) button.classList.add("personaje-fuera");
    if (personaje.ultimoEstado === "atacado")
      button.classList.add("personaje-atacado");
    if (personaje.ultimoEstado === "protegido")
      button.classList.add("personaje-protegido");
    if (personaje.ultimoEstado === "incorrecto")
      button.classList.add("personaje-incorrecto");
    if (personaje.ultimoEstado === "acierto")
      button.classList.add("personaje-acierto");

    const estado = obtenerTextoEstado(personaje);

    button.innerHTML = `
      <span class="personaje-avatar">${personaje.avatar}</span>
      <span class="personaje-nombre">${escapeHTML(personaje.nombre)}</span>
      <span class="personaje-estado">${escapeHTML(estado)}</span>
    `;

    button.disabled =
      !juegoEnCurso || juegoFinalizado || !puedeAcusar || personaje.fuera;
    button.addEventListener("click", () => manejarAcusacion(personaje.id));

    personajesGrid.appendChild(button);
  });
}

function obtenerTextoEstado(personaje) {
  if (juegoFinalizado && personaje.id === saboteadorId) return "Saboteador";
  if (personaje.fuera) return "Fuera";
  if (personaje.ultimoEstado === "atacado") return "Atacado";
  if (personaje.ultimoEstado === "protegido") return "Protegido";
  if (personaje.ultimoEstado === "incorrecto") return "No era";
  if (personaje.ultimoEstado === "acierto") return "Correcto";
  if (personaje.atacadoAlgunaVez) return "Descartable";
  return "Sospechoso";
}

function renderizarPistas() {
  if (historial.length === 0) {
    pistasLista.innerHTML = `<p>Todavía no hay pistas. Presioná “Iniciar misión”.</p>`;
    return;
  }

  pistasLista.innerHTML = "";

  historial.forEach((item) => {
    const div = document.createElement("div");
    div.className = "pista-item";

    if (item.resultado.includes("evitó")) div.classList.add("pista-salvado");
    if (item.resultado.includes("quedó fuera"))
      div.classList.add("pista-fuera");

    div.innerHTML = `
      <strong>Ronda ${item.ronda}</strong>
      <span>El Saboteador intentó sabotear a ${escapeHTML(item.atacado)}.</span>
      <span>El Técnico protegió a ${escapeHTML(item.protegido)}.</span>
      <span>${escapeHTML(item.resultado)}</span>
    `;

    pistasLista.appendChild(div);
  });
}

function renderizarHistorial() {
  if (historial.length === 0) {
    historialBody.innerHTML = `<tr><td colspan="5">Todavía no hay rondas registradas.</td></tr>`;
    return;
  }

  historialBody.innerHTML = "";

  historial.forEach((item) => {
    const row = document.createElement("tr");
    const acusacion =
      item.acusacion === "Pendiente"
        ? "Pendiente"
        : `${item.acusacion} (${item.acierto ? "correcta" : "incorrecta"})`;

    row.innerHTML = `
      <td>${item.ronda}</td>
      <td>${escapeHTML(item.atacado)}</td>
      <td>${escapeHTML(item.protegido)}</td>
      <td>${escapeHTML(item.resultado)}</td>
      <td>${escapeHTML(acusacion)}</td>
    `;

    historialBody.appendChild(row);
  });
}

function limpiarEstadosVisuales() {
  personajes = personajes.map((personaje) => ({
    ...personaje,
    ultimoEstado: personaje.fuera ? "fuera" : "",
  }));
}

function revelarSaboteador(descubrioSaboteador) {
  personajes = personajes.map((personaje) => {
    if (personaje.id === saboteadorId) {
      return {
        ...personaje,
        fuera: false,
        ultimoEstado: descubrioSaboteador ? "acierto" : "incorrecto",
      };
    }

    return personaje;
  });
}

function obtenerNombreSaboteador() {
  return (
    personajes.find((personaje) => personaje.id === saboteadorId)?.nombre ||
    "un personaje oculto"
  );
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

async function guardarIntento(descubrioSaboteador) {
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
        total_intercambios: puntajeActual,
        total_adivinanzas: acusaciones,
        tiempo_total_segundos: tiempo,
        completado: descubrioSaboteador,
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

/* =========================
   UTILIDADES
========================= */

function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function elegirAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function escapeHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
