const CONFIG = window.BUCLES_CONFIG;

const grupoSelect = document.getElementById("grupoSelect");
const estudianteSelect = document.getElementById("estudianteSelect");
const btnEntrar = document.getElementById("btnEntrar");
const estadoIngreso = document.getElementById("estadoIngreso");
const panelIngreso = document.getElementById("panelIngreso");
const panelUnidad = document.getElementById("panelUnidad");
const nombreJugador = document.getElementById("nombreJugador");
const grupoJugador = document.getElementById("grupoJugador");
const btnVolver = document.getElementById("btnVolver");
const estadoUnidad = document.getElementById("estadoUnidad");
const contenidoRecorrido = document.getElementById("contenidoRecorrido");
const recursoPanel = document.getElementById("recursoPanel");
const linkEduBlocks = document.getElementById("linkEduBlocks");
const edublocksProbado = document.getElementById("edublocksProbado");
const formComprobacion = document.getElementById("formComprobacion");
const resultadoEntrega = document.getElementById("resultadoEntrega");
const btnEnviar = document.getElementById("btnEnviar");

let grupoActual = null;
let estudianteActual = null;
let prediccionCorrecta = false;
let edublocksAbierto = false;
let entregado = false;
let vueltaSimulador = 0;
let sesion = crearSesion();

function crearSesion() {
  return {
    recorridoInicial: null,
    recorridoFinal: null,
    recursos: [],
    pistas: 0,
    practica: { simulaciones: 0 },
  };
}

function guardarSesion() {
  sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify(sesion));
}

function restaurarSesion() {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CONFIG.sessionKey));
    if (!guardada || typeof guardada !== "object") return;
    sesion = {
      ...crearSesion(),
      recorridoInicial: ["inicial", "guiado", "desafio"].includes(
        guardada.recorridoInicial,
      )
        ? guardada.recorridoInicial
        : null,
      recorridoFinal: ["inicial", "guiado", "desafio"].includes(
        guardada.recorridoFinal,
      )
        ? guardada.recorridoFinal
        : null,
      recursos: Array.isArray(guardada.recursos)
        ? guardada.recursos.filter((recurso) =>
            ["simulador", "predicciones", "construccion", "depuracion", "ampliacion"].includes(recurso),
          )
        : [],
      pistas: Number.isInteger(guardada.pistas) && guardada.pistas >= 0 ? guardada.pistas : 0,
      practica: {
        simulaciones:
          Number.isInteger(guardada.practica?.simulaciones) && guardada.practica.simulaciones >= 0
            ? guardada.practica.simulaciones
            : 0,
      },
    };
  } catch {
    sesion = crearSesion();
  }
}

function limpiarSesion() {
  sessionStorage.removeItem(CONFIG.sessionKey);
  sesion = crearSesion();
}

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  await cargarGrupos();
  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);
  btnEntrar.addEventListener("click", entrarUnidad);
  btnVolver.addEventListener("click", volverIngreso);
  document.querySelectorAll(".recorrido-btn").forEach((boton) =>
    boton.addEventListener("click", () => seleccionarRecorrido(boton.dataset.recorrido)),
  );
  document.querySelectorAll("[data-recurso]").forEach((boton) =>
    boton.addEventListener("click", () => abrirRecurso(boton.dataset.recurso)),
  );
  document.getElementById("btnDescubrir").addEventListener("click", revelarExplicacionBucle);
  document.getElementById("btnPrediccionInicial").addEventListener("click", comprobarPrediccionInicial);
  linkEduBlocks.href = CONFIG.eduBlocksUrl;
  linkEduBlocks.addEventListener("click", () => {
    edublocksAbierto = true;
    registrarRecurso("construccion");
  });
  formComprobacion.addEventListener("submit", entregarComprobacion);
}

function revelarExplicacionBucle() {
  const respuesta = document.querySelector('input[name="descubrimiento"]:checked');
  const feedback = document.getElementById("feedbackDescubrimiento");
  if (!respuesta) {
    feedback.textContent = "Elegí una idea antes de continuar.";
    return;
  }
  feedback.textContent = respuesta.value === "repetir"
    ? "Esa idea evita copiar la misma instrucción."
    : "Copiar funciona, pero una instrucción de repetición es más clara y fácil de cambiar.";
  document.getElementById("explicacionBucle").classList.remove("is-hidden");
  document.getElementById("explicacionBucle").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function cargarGrupos() {
  try {
    const respuesta = await fetch(`${CONFIG.apiBaseUrl}/grupos`);
    if (!respuesta.ok) throw new Error("No se pudieron cargar los grupos.");
    const grupos = await respuesta.json();
    grupoSelect.innerHTML = `<option value="">Elegí tu grupo</option>`;
    grupos.forEach((grupo) => {
      const opcion = document.createElement("option");
      opcion.value = grupo.id;
      opcion.textContent = grupo.nombre;
      opcion.dataset.nombre = grupo.nombre;
      grupoSelect.appendChild(opcion);
    });
  } catch (error) {
    console.error(error);
    grupoSelect.innerHTML = `<option value="">No se pudieron cargar los grupos</option>`;
    estadoIngreso.textContent = "No se pudo conectar con la lista de grupos.";
  }
}

async function manejarCambioGrupo() {
  limpiarSesion();
  estudianteActual = null;
  grupoActual = null;
  btnEntrar.disabled = true;
  const grupoId = Number(grupoSelect.value);
  if (!grupoId) {
    estudianteSelect.disabled = true;
    estudianteSelect.innerHTML = `<option value="">Primero elegí un grupo</option>`;
    return;
  }
  grupoActual = { id: grupoId, nombre: grupoSelect.selectedOptions[0].dataset.nombre };
  try {
    estudianteSelect.disabled = true;
    const respuesta = await fetch(`${CONFIG.apiBaseUrl}/estudiantes?grupo_id=${grupoId}`);
    if (!respuesta.ok) throw new Error("No se pudieron cargar los estudiantes.");
    const estudiantes = await respuesta.json();
    estudianteSelect.innerHTML = `<option value="">Elegí tu nombre</option>`;
    estudiantes.forEach((estudiante) => {
      const opcion = document.createElement("option");
      opcion.value = estudiante.id;
      opcion.textContent = estudiante.nombre_completo;
      opcion.dataset.nombre = estudiante.nombre_completo;
      opcion.dataset.inscripcion = estudiante.inscripcion_id || "";
      estudianteSelect.appendChild(opcion);
    });
    estudianteSelect.disabled = false;
    estadoIngreso.textContent = "";
  } catch (error) {
    console.error(error);
    estudianteSelect.innerHTML = `<option value="">No se pudieron cargar los estudiantes</option>`;
    estadoIngreso.textContent = "No se pudo conectar con la lista de estudiantes.";
  }
}

function manejarCambioEstudiante() {
  limpiarSesion();
  const opcion = estudianteSelect.selectedOptions[0];
  if (!opcion?.value || !grupoActual) {
    estudianteActual = null;
    btnEntrar.disabled = true;
    return;
  }
  estudianteActual = {
    id: Number(opcion.value),
    nombre: opcion.dataset.nombre,
    inscripcionId: opcion.dataset.inscripcion ? Number(opcion.dataset.inscripcion) : null,
  };
  btnEntrar.disabled = false;
}

async function entrarUnidad() {
  if (!grupoActual || !estudianteActual) return;
  btnEntrar.disabled = true;
  estadoIngreso.textContent = "Verificando disponibilidad…";
  try {
    const url = `${CONFIG.apiBaseUrl}/estado-intento?juego_slug=${CONFIG.juegoSlug}&estudiante_id=${estudianteActual.id}&grupo_id=${grupoActual.id}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("No se pudo verificar la actividad.");
    const estado = await respuesta.json();
    if (!estado.puede_jugar) {
      estadoIngreso.textContent = estado.motivo;
      return;
    }
    restaurarSesion();
    nombreJugador.textContent = estudianteActual.nombre;
    grupoJugador.textContent = `Grupo: ${grupoActual.nombre}`;
    panelIngreso.classList.add("is-hidden");
    panelUnidad.classList.remove("is-hidden");
    document.querySelector(".layout-game").classList.add("solo-unidad");
    estadoUnidad.textContent = "Podés elegir cualquier recorrido y recurso. No hay cronómetro.";
    seleccionarRecorrido(sesion.recorridoFinal || "inicial", false);
  } catch (error) {
    console.error(error);
    estadoIngreso.textContent = "No se pudo verificar la actividad. Avisá al docente.";
  } finally {
    btnEntrar.disabled = false;
  }
}

function volverIngreso() {
  limpiarSesion();
  panelUnidad.classList.add("is-hidden");
  panelIngreso.classList.remove("is-hidden");
  document.querySelector(".layout-game").classList.remove("solo-unidad");
  formComprobacion.reset();
  resultadoEntrega.textContent = "";
  entregado = false;
  prediccionCorrecta = false;
  edublocksAbierto = false;
  estadoIngreso.textContent = "Elegí nuevamente grupo y estudiante.";
}

function seleccionarRecorrido(recorrido, registrar = true) {
  if (!recorrido) return;
  if (!sesion.recorridoInicial) sesion.recorridoInicial = recorrido;
  sesion.recorridoFinal = recorrido;
  if (registrar) registrarRecurso("construccion", false);
  guardarSesion();
  document.querySelectorAll(".recorrido-btn").forEach((boton) => {
    const activo = boton.dataset.recorrido === recorrido;
    boton.setAttribute("aria-pressed", String(activo));
  });
  const contenidos = {
    inicial: `<h4>Inicial: mirá, completá y simulá</h4><ol><li>Observá: <code>for numero in range(5):</code>.</li><li>La instrucción dentro del bucle se repite cinco veces.</li><li>Completá la idea: cada vuelta muestra un número.</li></ol><button id="btnPista" type="button">Pedir pista</button><p id="pistaTexto" class="muted"></p>`,
    guiado: `<h4>Guiado: construí paso a paso</h4><ol><li>Elegí un bloque de repetición.</li><li>Indicá 5 repeticiones.</li><li>Dentro, agregá la acción para mostrar el número.</li><li>Antes de probar, predecí qué ocurrirá.</li></ol><p><strong>Qué entregar:</strong> una explicación oral de qué instrucción se repite.</p>`,
    desafio: `<h4>Desafío: construí y modificá</h4><ol><li>Construí una repetición que imprima del 1 al 5.</li><li>Modificá la cantidad usando una variable con <code>input()</code>.</li><li>Explicá qué cambia si la cantidad es 3.</li></ol><p>Usá solamente <code>for</code> y <code>range(n)</code>.</p>`,
  };
  contenidoRecorrido.innerHTML = contenidos[recorrido];
  const btnPista = document.getElementById("btnPista");
  if (btnPista) btnPista.addEventListener("click", mostrarPista);
  contenidoRecorrido.focus();
}

function mostrarPista() {
  sesion.pistas += 1;
  guardarSesion();
  const pistas = ["Contá las veces que el bloque vuelve a empezar.", "Todo lo que está dentro de for se ejecuta en cada vuelta.", "range(5) organiza cinco vueltas."];
  document.getElementById("pistaTexto").textContent = pistas[Math.min(sesion.pistas - 1, pistas.length - 1)];
  estadoUnidad.textContent = `Pista consultada. Llevás ${sesion.pistas}.`;
}

function registrarRecurso(recurso, guardar = true) {
  if (!sesion.recursos.includes(recurso)) sesion.recursos.push(recurso);
  if (guardar) guardarSesion();
}

function abrirRecurso(recurso) {
  registrarRecurso(recurso);
  const textos = {
    predicciones: "Predicción: con range(3), el bloque interior se repite tres veces. En Python, los valores visibles pueden empezar en 0.",
    construccion: "Construcción: empezá por el bloque repetir, elegí una cantidad y colocá dentro la acción que querés repetir.",
    depuracion: "Depuración: revisá que for termine con : y que la instrucción interior esté desplazada hacia adentro.",
    ampliacion: "Ampliación: pedí una cantidad con input(), convertíla con int() y usala como n en range(n).",
  };
  if (recurso === "simulador") {
    sesion.practica.simulaciones += 1;
    guardarSesion();
    vueltaSimulador = 0;
    renderizarSimulador();
    return;
  }
  guardarSesion();
  recursoPanel.textContent = textos[recurso];
}

function renderizarSimulador() {
  const salida = Array.from({ length: vueltaSimulador }, (_, indice) => indice + 1).join(", ") || "Todavía no hay salida.";
  const valor = vueltaSimulador === 0 ? "—" : String(vueltaSimulador - 1);
  const vuelta = vueltaSimulador === 0 ? "Aún no comenzó" : `${vueltaSimulador} de 5`;
  recursoPanel.innerHTML = `
    <h5>Simulador de <code>for vuelta in range(5)</code></h5>
    <p>La variable <code>vuelta</code> toma valores de 0 a 4; el programa muestra <code>vuelta + 1</code>.</p>
    <div class="simulador-datos" aria-live="polite">
      <div class="simulador-dato"><span>Vuelta actual</span><strong>${vuelta}</strong></div>
      <div class="simulador-dato"><span>Valor de <code>vuelta</code></span><strong>${valor}</strong></div>
      <div class="simulador-dato"><span>Salida acumulada</span><strong>${salida}</strong></div>
    </div>
    <div class="button-row" aria-label="Controles del simulador">
      <button id="btnSimRetroceder" type="button" ${vueltaSimulador === 0 ? "disabled" : ""}>Retroceder una vuelta</button>
      <button id="btnSimAvanzar" type="button" ${vueltaSimulador === 5 ? "disabled" : ""}>Avanzar una vuelta</button>
      <button id="btnSimReiniciar" type="button">Reiniciar simulador</button>
    </div>`;
  document.getElementById("btnSimAvanzar").addEventListener("click", () => {
    vueltaSimulador = Math.min(vueltaSimulador + 1, 5);
    renderizarSimulador();
  });
  document.getElementById("btnSimRetroceder").addEventListener("click", () => {
    vueltaSimulador = Math.max(vueltaSimulador - 1, 0);
    renderizarSimulador();
  });
  document.getElementById("btnSimReiniciar").addEventListener("click", () => {
    vueltaSimulador = 0;
    renderizarSimulador();
  });
}

function comprobarPrediccionInicial() {
  const respuesta = document.querySelector('input[name="prediccionInicial"]:checked');
  const feedback = document.getElementById("feedbackPrediccion");
  if (!respuesta) {
    feedback.textContent = "Elegí una opción antes de comprobar.";
    return;
  }
  prediccionCorrecta = respuesta.value === "4";
  feedback.textContent = prediccionCorrecta
    ? "Correcto: con range(4), la instrucción se repite cuatro veces."
    : "Todavía no: range(4) indica cuatro repeticiones. Mirá el simulador si querés revisarlo.";
}

async function entregarComprobacion(evento) {
  evento.preventDefault();
  if (entregado || !formComprobacion.reportValidity()) return;
  const respuestas = new FormData(formComprobacion);
  const aciertos = Number(respuestas.get("q1") === "a") + Number(respuestas.get("q2") === "b") + Number(respuestas.get("q3") === "a");
  const evidencia = {
    version: 1,
    recorrido_inicial: sesion.recorridoInicial || "inicial",
    recorrido_final: sesion.recorridoFinal || sesion.recorridoInicial || "inicial",
    uso_pistas: sesion.pistas,
    repeticion_comprendida: respuestas.get("q1") === "a",
    prediccion_correcta: prediccionCorrecta,
    error_identificado: respuestas.get("q3") === "a",
    comprobacion: { aciertos, total: 3 },
    edublocks_abierto: edublocksAbierto,
    edublocks_declarado_probado: edublocksProbado.checked,
  };
  btnEnviar.disabled = true;
  resultadoEntrega.className = "resultado";
  resultadoEntrega.textContent = "Guardando comprobación…";
  try {
    const respuesta = await fetch(`${CONFIG.apiBaseUrl}/intentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        juego_slug: CONFIG.juegoSlug,
        estudiante_id: estudianteActual.id,
        grupo_id: grupoActual.id,
        inscripcion_id: estudianteActual.inscripcionId,
        total_intercambios: evidencia.uso_pistas,
        total_adivinanzas: aciertos,
        tiempo_total_segundos: 0,
        completado: true,
        evidencia_json: evidencia,
      }),
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.error || "No se pudo guardar la comprobación.");
    entregado = true;
    limpiarSesion();
    btnEnviar.disabled = true;
    resultadoEntrega.className = "resultado ok";
    resultadoEntrega.textContent = `Comprobación entregada: ${aciertos} de 3 respuestas correctas. Podés seguir practicando, pero no volver a enviarla.`;
  } catch (error) {
    console.error(error);
    btnEnviar.disabled = false;
    resultadoEntrega.className = "resultado error";
    resultadoEntrega.textContent = error.message || "No se pudo guardar. Revisá la conexión y avisá al docente.";
  }
}
