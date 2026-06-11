const CONFIG = window.CANDADO_CONFIG;

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
const btnAceptar = document.getElementById("btnAceptar");

const candadoImagen = document.getElementById("candadoImagen");
const cantidadDigitosTexto = document.getElementById("cantidadDigitosTexto");

const resultado = document.getElementById("resultado");
const cronometro = document.getElementById("cronometro");

const contadorIntentos = document.getElementById("contadorIntentos");
const contadorPistas = document.getElementById("contadorPistas");
const historialBody = document.getElementById("historialBody");

const digitInputs = Array.from(document.querySelectorAll(".digit-input"));
const leds = Array.from(document.querySelectorAll(".led"));

let estudianteActual = null;
let grupoActual = null;

let codigoSecreto = "";
let juegoEnCurso = false;
let intervalo = null;
let tiempo = 0;

let totalIntentos = 0;
let totalPistas = 0;
let historial = [];

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  cantidadDigitosTexto.textContent = String(CONFIG.cantidadDigitos);
  candadoImagen.src = CONFIG.imagenCerrado;

  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);

  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnReiniciar.addEventListener("click", reiniciarJuego);
  btnAceptar.addEventListener("click", aceptarIntento);

  prepararInputs();
}

function prepararInputs() {
  digitInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);

      if (input.value && digitInputs[index + 1]) {
        digitInputs[index + 1].focus();
      }

      actualizarBotonAceptar();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && digitInputs[index - 1]) {
        digitInputs[index - 1].focus();
      }

      if (event.key === "Enter") {
        aceptarIntento();
      }
    });
  });
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
  estadoIngreso.textContent = "Consultando intentos disponibles...";

  try {
    const estado = await consultarEstadoIntento(estudianteActual.id);

    if (!estado.puede_jugar) {
      estadoIngreso.textContent = estado.motivo;
      btnEntrar.disabled = false;
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
    resultado.textContent = `Cuando estés pronto/a, presioná Iniciar juego. Intentos usados: ${estado.intentos_realizados} de ${estado.max_intentos}. Te quedan ${estado.intentos_restantes}.`;
  } catch (error) {
    console.error(error);
    estadoIngreso.textContent =
      "No se pudo consultar si tenés intentos disponibles. Avisá al docente.";
    btnEntrar.disabled = false;
  }
}

async function consultarEstadoIntento(estudianteId) {
  const url = `${CONFIG.apiBaseUrl}/estado-intento?juego_slug=${encodeURIComponent(CONFIG.juegoSlug)}&estudiante_id=${encodeURIComponent(estudianteId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("No se pudo consultar el estado del intento.");
  }

  return await response.json();
}

/* =========================
   JUEGO
========================= */

function iniciarJuego() {
  resetearEstadoJuego();

  codigoSecreto = generarCodigoSecreto();
  juegoEnCurso = true;

  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;

  habilitarInputs(true);
  limpiarInputs();
  limpiarLeds();

  resultado.className = "resultado";
  resultado.textContent =
    "Juego iniciado. Escribí una combinación y presioná Aceptar. Solo se confirmarán posiciones correctas.";

  iniciarCronometro();

  digitInputs[0].focus();

  //console.log("Código secreto:", codigoSecreto);
}

function resetearEstadoJuego() {
  detenerCronometro();

  tiempo = 0;
  totalIntentos = 0;
  totalPistas = 0;
  historial = [];
  codigoSecreto = "";
  juegoEnCurso = false;

  cronometro.textContent = "00:00";
  contadorIntentos.textContent = "0";
  contadorPistas.textContent = "0";

  candadoImagen.src = CONFIG.imagenCerrado;
  candadoImagen.alt = "Candado cerrado";

  habilitarInputs(false);
  limpiarInputs();
  limpiarLeds();
  btnAceptar.disabled = true;

  historialBody.innerHTML = `
    <tr>
      <td colspan="3">Todavía no hay intentos.</td>
    </tr>
  `;
}

function generarCodigoSecreto() {
  const digitos = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let codigo = "";

  if (CONFIG.permitirRepetidos) {
    for (let i = 0; i < CONFIG.cantidadDigitos; i++) {
      codigo += digitos[Math.floor(Math.random() * digitos.length)];
    }

    return codigo;
  }

  const disponibles = [...digitos];

  for (let i = 0; i < CONFIG.cantidadDigitos; i++) {
    const indice = Math.floor(Math.random() * disponibles.length);
    codigo += disponibles[indice];
    disponibles.splice(indice, 1);
  }

  return codigo;
}

function aceptarIntento() {
  if (!juegoEnCurso) return;

  const intento = obtenerIntento();

  if (intento.length !== CONFIG.cantidadDigitos) {
    resultado.className = "resultado error";
    resultado.textContent = `Completá los ${CONFIG.cantidadDigitos} números antes de aceptar.`;
    return;
  }

  if (!CONFIG.permitirRepetidos && tieneRepetidos(intento)) {
    resultado.className = "resultado error";
    resultado.textContent =
      "En esta misión no se permiten números repetidos. Cambiá la combinación.";
    return;
  }

  totalIntentos++;
  totalPistas++;

  contadorIntentos.textContent = String(totalIntentos);
  contadorPistas.textContent = String(totalPistas);

  const pistas = calcularPistas(intento);
  pintarLeds(pistas);

  historial.push({
    numero: totalIntentos,
    intento,
    pistas,
  });

  renderHistorial();

  if (pistas.every((pista) => pista.estado === "correcto")) {
    finalizarJuego();
    return;
  }

  resultado.className = "resultado warn";
  const correctas = contarPosicionesCorrectas(pistas);
  resultado.textContent =
    `Resultado: ${correctas} posición(es) correcta(s). Los números verdes quedan fijos; las demás posiciones no reciben pista.`;

  prepararSiguienteIntento(pistas);
}

function obtenerIntento() {
  return digitInputs.map((input) => input.value).join("");
}

function tieneRepetidos(texto) {
  return new Set(texto.split("")).size !== texto.length;
}

function calcularPistas(intento) {
  const secreto = codigoSecreto.split("");
  const prueba = intento.split("");

  return prueba.map((digito, index) => {
    if (digito === secreto[index]) {
      return {
        digito,
        estado: "correcto",
        texto: "Posición correcta",
      };
    }

    return {
      digito,
      estado: "sin-pista",
      texto: "Sin posición confirmada",
    };
  });
}

function pintarLeds(pistas) {
  leds.forEach((led, index) => {
    led.className = "led";

    const estado = pistas[index]?.estado;

    if (estado === "correcto") {
      led.classList.add("led-green");
      led.title = "Posición correcta";
    } else {
      led.classList.add("led-off");
      led.title = "Sin posición confirmada";
    }
  });
}

function limpiarLeds() {
  leds.forEach((led) => {
    led.className = "led led-off";
    led.title = "Sin posición confirmada";
  });
}

function habilitarInputs(habilitar) {
  digitInputs.forEach((input) => {
    if (input.classList.contains("digit-locked")) return;
    input.disabled = !habilitar;
  });
}

function limpiarInputs() {
  digitInputs.forEach((input) => {
    input.value = "";
    input.classList.remove("digit-locked");
  });
}

function prepararSiguienteIntento(pistas) {
  digitInputs.forEach((input, index) => {
    const pista = pistas[index];

    if (pista.estado === "correcto") {
      input.value = pista.digito;
      input.disabled = true;
      input.classList.add("digit-locked");
      return;
    }

    input.value = "";
    input.disabled = false;
    input.classList.remove("digit-locked");
  });

  const primerEditable = digitInputs.find((input) => !input.disabled);
  if (primerEditable) {
    primerEditable.focus();
  }

  actualizarBotonAceptar();
}

function actualizarBotonAceptar() {
  if (!juegoEnCurso) {
    btnAceptar.disabled = true;
    return;
  }

  const completo = digitInputs.every((input) => input.value.length === 1);
  btnAceptar.disabled = !completo;
}

function renderHistorial() {
  historialBody.innerHTML = "";

  historial.forEach((fila) => {
    const tr = document.createElement("tr");
    const correctas = contarPosicionesCorrectas(fila.pistas);

    tr.innerHTML = `
      <td>${fila.numero}</td>
      <td><strong>${fila.intento}</strong></td>
      <td>
        <div class="pista-lista">
          ${crearResumenPistas(correctas)}
        </div>
      </td>
    `;

    historialBody.appendChild(tr);
  });
}

function contarPosicionesCorrectas(pistas) {
  return pistas.filter((pista) => pista.estado === "correcto").length;
}

function crearResumenPistas(correctas) {
  if (correctas === 0) {
    return `<span class="pista-chip">Sin posiciones correctas</span>`;
  }

  if (correctas === 1) {
    return `<span class="pista-chip">🟢 1 posición correcta</span>`;
  }

  return `<span class="pista-chip">🟢 ${correctas} posiciones correctas</span>`;
}

/* =========================
   FINALIZAR Y GUARDAR
========================= */

async function finalizarJuego() {
  juegoEnCurso = false;
  detenerCronometro();

  btnIniciar.disabled = false;
  btnReiniciar.disabled = false;
  btnAceptar.disabled = true;

  habilitarInputs(false);

  candadoImagen.src = CONFIG.imagenAbierto;
  candadoImagen.alt = "Candado abierto";

  resultado.className = "resultado ok";
  resultado.textContent = `¡Candado abierto! Código: ${codigoSecreto}. Tiempo: ${formatearTiempo(tiempo)}. Intentos: ${totalIntentos}.`;

  await guardarIntento();
}

async function guardarIntento() {
  const payload = {
    juego_slug: CONFIG.juegoSlug,
    estudiante_id: estudianteActual.id,
    grupo_id: grupoActual.id,
    inscripcion_id: estudianteActual.inscripcion_id,

    total_intercambios: totalIntentos,
    total_adivinanzas: totalPistas,

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

    if (!response.ok) {
      let mensaje = "No se pudo guardar el intento.";

      try {
        const errorData = await response.json();
        if (errorData.error) mensaje = errorData.error;
      } catch (_) {
        // Si el backend no responde JSON, mantenemos el mensaje genérico.
      }

      throw new Error(mensaje);
    }

    const data = await response.json();
    resultado.textContent += ` El intento quedó guardado. Intentos usados: ${data.intentos_realizados} de ${data.max_intentos}.`;
  } catch (error) {
    console.error(error);
    resultado.textContent += ` Atención: ${error.message}`;
  }
}

function reiniciarJuego() {
  resetearEstadoJuego();

  btnIniciar.disabled = false;
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
