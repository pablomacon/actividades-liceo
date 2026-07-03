const CONFIG = window.RADAR_CONFIG;

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

const sectoresTexto = document.getElementById("sectoresTexto");
const maxEscaneosTexto = document.getElementById("maxEscaneosTexto");
const sectoresGrid = document.getElementById("sectoresGrid");

const resultado = document.getElementById("resultado");
const cronometro = document.getElementById("cronometro");

const contadorEscaneos = document.getElementById("contadorEscaneos");
const contadorRestantes = document.getElementById("contadorRestantes");
const rangoPosible = document.getElementById("rangoPosible");
const historialBody = document.getElementById("historialBody");

let estudianteActual = null;
let grupoActual = null;

let barcoSector = null;
let juegoEnCurso = false;
let juegoFinalizado = false;
let intervalo = null;
let tiempo = 0;
let totalEscaneos = 0;
let limiteOeste = 1;
let limiteEste = 32;
let historial = [];
let intentoGuardado = false;

const sectorButtons = [];

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  sectoresTexto.textContent = String(CONFIG.cantidadSectores);
  maxEscaneosTexto.textContent = String(CONFIG.maxEscaneos);
  limiteEste = CONFIG.cantidadSectores;

  crearSectores();
  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);

  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnReiniciar.addEventListener("click", reiniciarJuego);

  actualizarContadores();
}

function crearSectores() {
  sectoresGrid.innerHTML = "";
  sectorButtons.length = 0;

  for (let i = 1; i <= CONFIG.cantidadSectores; i++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sector-btn";
    button.textContent = String(i).padStart(2, "0");
    button.dataset.sector = String(i);
    button.disabled = true;
    button.addEventListener("click", () => escanearSector(i));

    sectoresGrid.appendChild(button);
    sectorButtons.push(button);
  }
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
    estadoIngreso.textContent =
      "No se pudo conectar con la lista de grupos. Revisá el backend o la configuración.";
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

  grupoActual = {
    id: Number(grupoId),
    nombre: grupoNombre,
  };

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
      "No se pudo conectar con la lista de estudiantes. Revisá el backend.";
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
    if (layoutGame) {
      layoutGame.classList.add("solo-juego");
    }

    resultado.className = "resultado";
    resultado.textContent = `Intentos usados: ${estado.intentos_realizados} de ${estado.max_intentos}. Te quedan ${estado.intentos_restantes}. Cuando estés pronto/a, presioná Iniciar radar.`;
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
  resetearEstadoJuego();

  barcoSector = generarSectorBarco();
  juegoEnCurso = true;
  juegoFinalizado = false;
  intentoGuardado = false;

  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;

  habilitarSectores(true);

  resultado.className = "resultado";
  resultado.textContent =
    "Radar iniciado. Elegí un sector para escanear. Pensá si conviene probar al azar o dividir la costa.";

  iniciarCronometro();

  // console.log("Sector del barco:", barcoSector);
}

function resetearEstadoJuego() {
  detenerCronometro();

  tiempo = 0;
  totalEscaneos = 0;
  limiteOeste = 1;
  limiteEste = CONFIG.cantidadSectores;
  historial = [];
  barcoSector = null;
  juegoEnCurso = false;
  juegoFinalizado = false;

  cronometro.textContent = "00:00";
  limpiarSectores();
  actualizarContadores();

  historialBody.innerHTML = `
    <tr>
      <td colspan="3">Todavía no hay escaneos.</td>
    </tr>
  `;
}

function generarSectorBarco() {
  return Math.floor(Math.random() * CONFIG.cantidadSectores) + 1;
}

function escanearSector(sector) {
  if (!juegoEnCurso || juegoFinalizado) return;

  const button = sectorButtons[sector - 1];
  if (!button || button.disabled) return;

  totalEscaneos++;
  button.classList.add("sector-scanned");
  button.disabled = true;

  let respuestaRadar = "";

  if (sector === barcoSector) {
    respuestaRadar = "¡Barco encontrado!";
    button.classList.add("sector-found");
    historial.push({
      numero: totalEscaneos,
      sector,
      respuesta: respuestaRadar,
    });
    renderHistorial();
    finalizarJuego(true);
    return;
  }

  if (sector < barcoSector) {
    respuestaRadar = "El barco está más al Este.";
    descartarSectores(1, sector);
    limiteOeste = Math.max(limiteOeste, sector + 1);
  } else {
    respuestaRadar = "El barco está más al Oeste.";
    descartarSectores(sector, CONFIG.cantidadSectores);
    limiteEste = Math.min(limiteEste, sector - 1);
  }

  historial.push({ numero: totalEscaneos, sector, respuesta: respuestaRadar });
  renderHistorial();
  actualizarContadores();

  if (totalEscaneos >= CONFIG.maxEscaneos) {
    resultado.className = "resultado error";
    resultado.textContent = `Se agotaron los ${CONFIG.maxEscaneos} escaneos. El barco estaba en el sector ${barcoSector}. Probá pensar una estrategia de mitades para la próxima.`;
    finalizarJuego(false);
    return;
  }

  resultado.className = "resultado warn";
  resultado.textContent = `${respuestaRadar} Ahora el rango posible es ${limiteOeste} a ${limiteEste}.`;
}

function descartarSectores(desde, hasta) {
  for (let i = desde; i <= hasta; i++) {
    if (i < 1 || i > CONFIG.cantidadSectores) continue;

    const button = sectorButtons[i - 1];
    if (!button || button.classList.contains("sector-found")) continue;

    button.classList.add("sector-descartado");
    button.disabled = true;
  }
}

function limpiarSectores() {
  sectorButtons.forEach((button) => {
    button.className = "sector-btn";
    button.disabled = true;
  });
}

function habilitarSectores(habilitar) {
  sectorButtons.forEach((button) => {
    if (button.classList.contains("sector-descartado")) return;
    if (button.classList.contains("sector-scanned")) return;
    button.disabled = !habilitar;
  });
}

function actualizarContadores() {
  contadorEscaneos.textContent = String(totalEscaneos);
  contadorRestantes.textContent = String(
    Math.max(CONFIG.maxEscaneos - totalEscaneos, 0),
  );
  rangoPosible.textContent = `${limiteOeste} a ${limiteEste}`;
}

function renderHistorial() {
  historialBody.innerHTML = "";

  historial.forEach((fila) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${fila.numero}</td>
      <td><strong>${String(fila.sector).padStart(2, "0")}</strong></td>
      <td>${fila.respuesta}</td>
    `;

    historialBody.appendChild(tr);
  });
}

/* =========================
   FINALIZAR Y GUARDAR
========================= */

async function finalizarJuego(encontrado) {
  juegoEnCurso = false;
  juegoFinalizado = true;
  detenerCronometro();
  habilitarSectores(false);

  btnIniciar.disabled = false;
  btnReiniciar.disabled = false;

  actualizarContadores();

  if (encontrado) {
    resultado.className = "resultado ok";
    resultado.textContent = `¡Barco encontrado en el sector ${barcoSector}! Tiempo: ${formatearTiempo(tiempo)}. Escaneos: ${totalEscaneos}.`;
  }

  await guardarIntento(encontrado);
}

async function guardarIntento(encontrado) {
  if (intentoGuardado) return;
  intentoGuardado = true;

  const payload = {
    juego_slug: CONFIG.juegoSlug,
    estudiante_id: estudianteActual.id,
    grupo_id: grupoActual.id,
    inscripcion_id: estudianteActual.inscripcion_id,

    // En esta actividad reutilizamos los campos existentes:
    // total_intercambios = 1 si encontró el barco, 0 si no lo encontró.
    // total_adivinanzas = cantidad de escaneos realizados.
    total_intercambios: encontrado ? 1 : 0,
    total_adivinanzas: totalEscaneos,

    tiempo_total_segundos: tiempo,
    completado: true,
  };

  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/intentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo guardar el intento.");
    }

    const restantes = data?.intentos_restantes;
    if (restantes !== undefined) {
      resultado.textContent += ` El intento quedó guardado. Te quedan ${restantes} intentos registrados.`;
    } else {
      resultado.textContent += " El intento quedó guardado.";
    }
  } catch (error) {
    console.error(error);
    resultado.textContent += ` Atención: el juego terminó, pero no se pudo guardar el intento. ${error.message}`;
  }
}

function reiniciarJuego() {
  resetearEstadoJuego();

  btnIniciar.disabled = false;
  btnReiniciar.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Juego reiniciado. Presioná Iniciar radar para volver a comenzar.";
}

/* =========================
   CRONÓMETRO
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
  if (intervalo) {
    clearInterval(intervalo);
    intervalo = null;
  }
}

function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60)
    .toString()
    .padStart(2, "0");

  const segundos = (segundosTotales % 60).toString().padStart(2, "0");

  return `${minutos}:${segundos}`;
}
