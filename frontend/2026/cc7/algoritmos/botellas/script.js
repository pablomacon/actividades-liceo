const CONFIG = window.BOTELLAS_CONFIG;

const grupoSelect = document.getElementById("grupoSelect");
const estudianteSelect = document.getElementById("estudianteSelect");
const btnEntrar = document.getElementById("btnEntrar");
const estadoIngreso = document.getElementById("estadoIngreso");

const panelIngreso = document.getElementById("panelIngreso");
const panelJuego = document.getElementById("panelJuego");

const nombreJugador = document.getElementById("nombreJugador");
const grupoJugador = document.getElementById("grupoJugador");

const btnIniciar = document.getElementById("btnIniciar");
const btnAdivinar = document.getElementById("btnAdivinar");
const btnReiniciar = document.getElementById("btnReiniciar");

const botellas = document.getElementById("botellas");
const resultado = document.getElementById("resultado");
const cronometro = document.getElementById("cronometro");

const contadorIntercambios = document.getElementById("contadorIntercambios");
const contadorAdivinanzas = document.getElementById("contadorAdivinanzas");

const colores = ["rojo", "azul", "verde", "amarillo", "morado"];

let estudianteActual = null;
let grupoActual = null;

let ordenCorrecto = [];
let ordenActual = [];

let juegoEnCurso = false;
let intervalo = null;
let tiempo = 0;

let botellaArrastrada = null;
let botellaSeleccionada = null;

let totalIntercambios = 0;
let totalAdivinanzas = 0;

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);

  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnAdivinar.addEventListener("click", adivinar);
  btnReiniciar.addEventListener("click", reiniciarJuego);
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

function entrarAlDesafio() {
  if (!estudianteActual || !grupoActual) return;

  nombreJugador.textContent = estudianteActual.nombre_completo;
  grupoJugador.textContent = `Grupo: ${grupoActual.nombre}`;

  panelIngreso.classList.add("is-hidden");
  panelJuego.classList.remove("is-hidden");

  const layoutGame = document.querySelector(".layout-game");
  if (layoutGame) {
    layoutGame.classList.add("solo-juego");
  }

  resultado.textContent = "Cuando estés pronto/a, presioná Iniciar juego.";
}

/* =========================
   JUEGO
========================= */

function iniciarJuego() {
  resetearEstadoJuego();
  generarOrdenesValidas();
  renderBotellas();

  juegoEnCurso = true;
  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;
  btnAdivinar.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Juego iniciado. Hacé al menos un intercambio para poder adivinar.";

  iniciarCronometro();
}

function resetearEstadoJuego() {
  detenerCronometro();

  tiempo = 0;
  totalIntercambios = 0;
  totalAdivinanzas = 0;
  botellaArrastrada = null;
  botellaSeleccionada = null;

  cronometro.textContent = "00:00";
  contadorIntercambios.textContent = "0";
  contadorAdivinanzas.textContent = "0";

  ordenCorrecto = [];
  ordenActual = [];
  botellas.innerHTML = "";
}

function generarOrdenesValidas() {
  ordenCorrecto = mezclar([0, 1, 2, 3, 4]);
  ordenActual = mezclar([...ordenCorrecto]);

  // Evita que el juego empiece ya resuelto.
  while (sonIguales(ordenCorrecto, ordenActual)) {
    ordenActual = mezclar([...ordenCorrecto]);
  }
}

function mezclar(array) {
  const copia = [...array];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function sonIguales(a, b) {
  return a.length === b.length && a.every((valor, index) => valor === b[index]);
}

function renderBotellas() {
  botellas.innerHTML = "";

  ordenActual.forEach((valor, posicion) => {
    const botella = document.createElement("button");
    botella.type = "button";
    botella.className = `bottle ${colores[valor]}`;
    botella.draggable = true;
    botella.dataset.valor = valor;
    botella.dataset.posicion = posicion;
    botella.setAttribute("aria-label", `Botella ${posicion + 1}`);

    botella.addEventListener("dragstart", manejarDragStart);
    botella.addEventListener("dragover", manejarDragOver);
    botella.addEventListener("drop", manejarDrop);
    botella.addEventListener("click", manejarClickBotella);

    botellas.appendChild(botella);
  });
}

function manejarDragStart(event) {
  if (!juegoEnCurso) return;
  botellaArrastrada = Number(event.currentTarget.dataset.posicion);
}

function manejarDragOver(event) {
  if (!juegoEnCurso) return;
  event.preventDefault();
}

function manejarDrop(event) {
  if (!juegoEnCurso) return;

  event.preventDefault();

  const destino = Number(event.currentTarget.dataset.posicion);

  if (botellaArrastrada === null || botellaArrastrada === destino) {
    botellaArrastrada = null;
    return;
  }

  intercambiarBotellas(botellaArrastrada, destino);
  botellaArrastrada = null;
}

function manejarClickBotella(event) {
  if (!juegoEnCurso) return;

  const posicion = Number(event.currentTarget.dataset.posicion);

  if (botellaSeleccionada === null) {
    botellaSeleccionada = posicion;
    marcarSeleccion(posicion);
    return;
  }

  if (botellaSeleccionada === posicion) {
    botellaSeleccionada = null;
    limpiarSeleccion();
    return;
  }

  intercambiarBotellas(botellaSeleccionada, posicion);
  botellaSeleccionada = null;
}

function marcarSeleccion(posicion) {
  limpiarSeleccion();

  const botella = botellas.querySelector(`[data-posicion="${posicion}"]`);
  if (botella) botella.classList.add("selected");
}

function limpiarSeleccion() {
  botellas.querySelectorAll(".bottle").forEach((botella) => {
    botella.classList.remove("selected");
  });
}

function intercambiarBotellas(origen, destino) {
  [ordenActual[origen], ordenActual[destino]] = [
    ordenActual[destino],
    ordenActual[origen],
  ];

  totalIntercambios++;
  contadorIntercambios.textContent = String(totalIntercambios);

  btnAdivinar.disabled = false;

  resultado.className = "resultado";
  resultado.textContent = "Movimiento registrado. Ahora podés adivinar.";

  renderBotellas();
}

/* =========================
   ADIVINAR Y FINALIZAR
========================= */

async function adivinar() {
  if (!juegoEnCurso) return;

  if (totalIntercambios === 0) {
    resultado.className = "resultado warn";
    resultado.textContent =
      "Antes de adivinar tenés que hacer por lo menos un intercambio.";
    btnAdivinar.disabled = true;
    return;
  }

  totalAdivinanzas++;
  contadorAdivinanzas.textContent = String(totalAdivinanzas);

  const aciertos = contarAciertos();

  if (aciertos === ordenCorrecto.length) {
    await finalizarJuego();
  } else {
    resultado.className = "resultado warn";
    resultado.textContent = `Tenés ${aciertos} de ${ordenCorrecto.length} botellas en la posición correcta. Seguí probando.`;
  }
}

function contarAciertos() {
  return ordenActual.filter((valor, index) => valor === ordenCorrecto[index])
    .length;
}

async function finalizarJuego() {
  juegoEnCurso = false;
  detenerCronometro();

  btnAdivinar.disabled = true;
  btnReiniciar.disabled = false;
  btnIniciar.disabled = false;

  resultado.className = "resultado ok";
  resultado.textContent =
    `¡Misión cumplida! Tiempo: ${formatearTiempo(tiempo)}. ` +
    `Intercambios: ${totalIntercambios}. Adivinanzas: ${totalAdivinanzas}.`;

  await guardarIntento();
}

async function guardarIntento() {
  const payload = {
    juego_slug: CONFIG.juegoSlug,
    estudiante_id: estudianteActual.id,
    grupo_id: grupoActual.id,
    inscripcion_id: estudianteActual.inscripcion_id,
    total_intercambios: totalIntercambios,
    total_adivinanzas: totalAdivinanzas,
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

    if (!response.ok) throw new Error("No se pudo guardar el intento.");

    resultado.textContent += " El intento quedó guardado.";
  } catch (error) {
    console.error(error);
    resultado.textContent +=
      " Atención: el juego terminó, pero no se pudo guardar el intento.";
  }
}

function reiniciarJuego() {
  juegoEnCurso = false;
  detenerCronometro();

  resetearEstadoJuego();

  btnIniciar.disabled = false;
  btnAdivinar.disabled = true;
  btnReiniciar.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Juego reiniciado. Presioná Iniciar juego para volver a comenzar.";
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
