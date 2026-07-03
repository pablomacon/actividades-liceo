const CONFIG = window.CRIPTOGRAFOS_CONFIG;

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
const btnDeshacer = document.getElementById("btnDeshacer");

const cronometro = document.getElementById("cronometro");
const resultado = document.getElementById("resultado");
const mapSvg = document.getElementById("mapSvg");
const ciudadesLayer = document.getElementById("ciudadesLayer");

const limiteTexto = document.getElementById("limiteTexto");
const origenTexto = document.getElementById("origenTexto");
const destinoTexto = document.getElementById("destinoTexto");
const ciudadActualTexto = document.getElementById("ciudadActualTexto");
const contadorPasos = document.getElementById("contadorPasos");
const contadorCosto = document.getElementById("contadorCosto");
const rutaTexto = document.getElementById("rutaTexto");
const historialBody = document.getElementById("historialBody");

let estudianteActual = null;
let grupoActual = null;
let juegoEnCurso = false;
let juegoFinalizado = false;
let intervalo = null;
let tiempo = 0;
let intentoGuardado = false;

let ciudadActual = CONFIG.ciudadInicio;
let ruta = [];
let saltos = [];
let costoTotal = 0;

const ciudades = {
  // Disposición tipo grafo por filas. No busca enseñar geografía,
  // sino mostrar nodos y conexiones sin cruces innecesarios.
  Rivera: { x: 50, y: 9 },

  "Paso de los Toros": { x: 22, y: 29 },
  Durazno: { x: 50, y: 29 },
  Tacuarembó: { x: 78, y: 29 },

  Trinidad: { x: 22, y: 50 },
  Florida: { x: 50, y: 50 },
  Rocha: { x: 78, y: 50 },

  "San José": { x: 22, y: 71 },
  Canelones: { x: 50, y: 71 },
  Maldonado: { x: 78, y: 71 },

  Montevideo: { x: 50, y: 91 },
};

const baseConexiones = [
  // Cada conexión tiene un rango de interferencia posible.
  // Los costos cambian al iniciar cada partida.
  ["Montevideo", "San José", 2, 9],
  ["Montevideo", "Canelones", 2, 9],
  ["Montevideo", "Maldonado", 2, 9],

  ["San José", "Canelones", 2, 8],
  ["Canelones", "Maldonado", 2, 8],

  ["San José", "Trinidad", 2, 9],
  ["Canelones", "Florida", 2, 9],
  ["Maldonado", "Rocha", 2, 9],

  ["San José", "Florida", 3, 11],
  ["Canelones", "Rocha", 4, 12],
  ["Maldonado", "Florida", 3, 11],

  ["Trinidad", "Florida", 2, 8],
  ["Florida", "Rocha", 2, 8],

  ["Trinidad", "Paso de los Toros", 2, 10],
  ["Florida", "Durazno", 2, 10],
  ["Rocha", "Tacuarembó", 2, 10],

  ["Trinidad", "Durazno", 3, 11],
  ["Florida", "Tacuarembó", 4, 12],
  ["Rocha", "Durazno", 4, 12],

  ["Paso de los Toros", "Durazno", 2, 8],
  ["Durazno", "Tacuarembó", 2, 8],

  ["Paso de los Toros", "Rivera", 3, 12],
  ["Durazno", "Rivera", 2, 12],
  ["Tacuarembó", "Rivera", 3, 12],
];

let conexiones = [];
let interferenciaMaximaActual = CONFIG.interferenciaMaxima;
let costoOptimoActual = CONFIG.costoOptimo;

const offsetCostos = {
  "Montevideo|San José": { dx: -6, dy: 2 },
  "Montevideo|Canelones": { dx: -4, dy: 0 },
  "Montevideo|Maldonado": { dx: 6, dy: 2 },

  "San José|Canelones": { dx: 0, dy: -2 },
  "Canelones|Maldonado": { dx: 0, dy: -2 },

  "San José|Trinidad": { dx: -4, dy: 0 },
  "Canelones|Florida": { dx: -4, dy: 0 },
  "Maldonado|Rocha": { dx: 5, dy: 0 },

  "San José|Florida": { dx: -3, dy: -3 },
  "Canelones|Rocha": { dx: 4, dy: -3 },
  "Maldonado|Florida": { dx: 3, dy: -3 },

  "Trinidad|Florida": { dx: 0, dy: -2 },
  "Florida|Rocha": { dx: 0, dy: -2 },

  "Trinidad|Paso de los Toros": { dx: -6, dy: 0 },
  "Florida|Durazno": { dx: -4, dy: 0 },
  "Rocha|Tacuarembó": { dx: 6, dy: 0 },

  "Trinidad|Durazno": { dx: -3, dy: -3 },
  "Florida|Tacuarembó": { dx: 4, dy: -3 },
  "Rocha|Durazno": { dx: 4, dy: -3 },

  "Paso de los Toros|Durazno": { dx: 0, dy: -2 },
  "Durazno|Tacuarembó": { dx: 0, dy: -2 },

  "Paso de los Toros|Rivera": { dx: -5, dy: -2 },
  "Durazno|Rivera": { dx: 5, dy: 0 },
  "Tacuarembó|Rivera": { dx: 5, dy: -2 },
};

const ciudadButtons = new Map();

document.addEventListener("DOMContentLoaded", iniciarPantalla);

async function iniciarPantalla() {
  origenTexto.textContent = CONFIG.ciudadInicio;
  destinoTexto.textContent = CONFIG.ciudadDestino;

  prepararNuevaRed();
  dibujarMapa();
  resetearEstadoJuego(false);
  await cargarGrupos();

  grupoSelect.addEventListener("change", manejarCambioGrupo);
  estudianteSelect.addEventListener("change", manejarCambioEstudiante);
  btnEntrar.addEventListener("click", entrarAlDesafio);
  btnIniciar.addEventListener("click", iniciarJuego);
  btnReiniciar.addEventListener("click", reiniciarJuego);
  btnDeshacer.addEventListener("click", deshacerUltimoPaso);
}

function prepararNuevaRed() {
  conexiones = baseConexiones.map(([desde, hasta, minimo, maximo]) => [
    desde,
    hasta,
    numeroAleatorio(minimo, maximo),
  ]);

  const mejorRuta = calcularMejorRuta(
    CONFIG.ciudadInicio,
    CONFIG.ciudadDestino,
  );
  costoOptimoActual = mejorRuta.costo;
  interferenciaMaximaActual =
    costoOptimoActual + (CONFIG.margenInterferencia ?? 4);

  limiteTexto.textContent = String(interferenciaMaximaActual);
}

function numeroAleatorio(minimo, maximo) {
  return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function calcularMejorRuta(origen, destino) {
  const distancias = {};
  const anteriores = {};
  const pendientes = new Set(Object.keys(ciudades));

  Object.keys(ciudades).forEach((ciudad) => {
    distancias[ciudad] = Infinity;
  });
  distancias[origen] = 0;

  while (pendientes.size > 0) {
    let actual = null;
    let mejorDistancia = Infinity;

    pendientes.forEach((ciudad) => {
      if (distancias[ciudad] < mejorDistancia) {
        mejorDistancia = distancias[ciudad];
        actual = ciudad;
      }
    });

    if (actual === null || actual === destino) break;

    pendientes.delete(actual);

    conexiones
      .filter(([a, b]) => a === actual || b === actual)
      .forEach(([a, b, costo]) => {
        const vecina = a === actual ? b : a;
        if (!pendientes.has(vecina)) return;

        const nuevaDistancia = distancias[actual] + costo;
        if (nuevaDistancia < distancias[vecina]) {
          distancias[vecina] = nuevaDistancia;
          anteriores[vecina] = actual;
        }
      });
  }

  const camino = [];
  let actual = destino;
  while (actual) {
    camino.unshift(actual);
    actual = anteriores[actual];
  }

  return {
    costo: distancias[destino],
    camino,
  };
}

function dibujarMapa() {
  mapSvg.innerHTML = "";
  ciudadesLayer.innerHTML = "";
  ciudadButtons.clear();

  dibujarSiluetaUruguay();

  conexiones.forEach(([desde, hasta, costo]) => {
    const a = ciudades[desde];
    const b = ciudades[hasta];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
    line.classList.add("connection-line");
    line.dataset.desde = desde;
    line.dataset.hasta = hasta;
    mapSvg.appendChild(line);

    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const offset = obtenerOffsetCosto(desde, hasta);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX + offset.dx);
    text.setAttribute("y", midY + offset.dy);
    text.setAttribute("text-anchor", "middle");
    text.classList.add("connection-cost");
    text.textContent = String(costo);
    mapSvg.appendChild(text);
  });

  function dibujarSiluetaUruguay() {
    // Fondo esquemático de grafo por niveles: ayuda a leer filas y no pretende ser un mapa real.
    const niveles = [9, 29, 50, 71, 91];
    niveles.forEach((y) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", "8");
      line.setAttribute("y1", y);
      line.setAttribute("x2", "92");
      line.setAttribute("y2", y);
      line.classList.add("graph-guide-line");
      mapSvg.appendChild(line);
    });

    const columnas = [22, 50, 78];
    columnas.forEach((x) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", "13");
      line.setAttribute("x2", x);
      line.setAttribute("y2", "88");
      line.classList.add("graph-guide-line", "graph-guide-vertical");
      mapSvg.appendChild(line);
    });
  }

  function obtenerOffsetCosto(desde, hasta) {
    const directo = `${desde}|${hasta}`;
    const inverso = `${hasta}|${desde}`;
    return offsetCostos[directo] || offsetCostos[inverso] || { dx: 0, dy: -1 };
  }

  Object.entries(ciudades).forEach(([nombre, pos]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "city-btn";
    button.textContent = nombre;
    button.style.left = `${pos.x}%`;
    button.style.top = `${pos.y}%`;
    button.disabled = true;
    button.dataset.ciudad = nombre;
    button.addEventListener("click", () => elegirCiudad(nombre));

    ciudadesLayer.appendChild(button);
    ciudadButtons.set(nombre, button);
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
    if (layoutGame) layoutGame.classList.add("solo-juego");

    resultado.className = "resultado";
    resultado.textContent = `Intentos usados: ${estado.intentos_realizados} de ${estado.max_intentos}. Te quedan ${estado.intentos_restantes}. Cuando estés pronto/a, presioná Iniciar transmisión.`;
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
  prepararNuevaRed();
  dibujarMapa();
  resetearEstadoJuego(true);
  juegoEnCurso = true;
  juegoFinalizado = false;
  intentoGuardado = false;

  btnIniciar.disabled = true;
  btnReiniciar.disabled = false;
  btnDeshacer.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Transmisión iniciada. Los costos de interferencia cambiaron para esta partida. Elegí una ciudad conectada y compará los valores antes de avanzar.";

  actualizarMapaInteractivo();
  iniciarCronometro();
}

function resetearEstadoJuego(mantenerMensaje) {
  detenerCronometro();
  tiempo = 0;
  ciudadActual = CONFIG.ciudadInicio;
  ruta = [CONFIG.ciudadInicio];
  saltos = [];
  costoTotal = 0;
  juegoEnCurso = false;
  juegoFinalizado = false;
  cronometro.textContent = "00:00";

  ciudadButtons.forEach((button) => {
    button.disabled = true;
    button.className = "city-btn";
  });

  limpiarLineasActivas();
  actualizarPanelRuta();
  renderHistorial();

  if (!mantenerMensaje) {
    resultado.className = "resultado";
    resultado.textContent = "Presioná Iniciar transmisión para comenzar.";
  }
}

function elegirCiudad(nombreCiudad) {
  if (!juegoEnCurso || juegoFinalizado) return;
  if (nombreCiudad === ciudadActual) return;

  const conexion = obtenerConexion(ciudadActual, nombreCiudad);
  if (!conexion) return;

  const [desde, hasta, costo] = conexion;
  const origen = desde === ciudadActual ? desde : hasta;
  const destino = desde === ciudadActual ? hasta : desde;

  saltos.push({ desde: origen, hasta: destino, costo });
  ruta.push(nombreCiudad);
  costoTotal += costo;
  ciudadActual = nombreCiudad;

  actualizarPanelRuta();
  renderHistorial();
  actualizarMapaInteractivo();

  if (ciudadActual === CONFIG.ciudadDestino) {
    finalizarJuego();
    return;
  }

  if (costoTotal > interferenciaMaximaActual) {
    resultado.className = "resultado warn";
    resultado.textContent = `Atención: la interferencia ya llegó a ${costoTotal}. Todavía podés llegar, pero quizás el mensaje sea interceptado.`;
  } else {
    resultado.className = "resultado";
    resultado.textContent = `Mensaje en ${ciudadActual}. Elegí el próximo salto. Interferencia acumulada: ${costoTotal}.`;
  }
}

function obtenerConexion(ciudadA, ciudadB) {
  return conexiones.find(
    ([a, b]) =>
      (a === ciudadA && b === ciudadB) || (a === ciudadB && b === ciudadA),
  );
}

function obtenerVecinas(ciudad) {
  return conexiones
    .filter(([a, b]) => a === ciudad || b === ciudad)
    .map(([a, b]) => (a === ciudad ? b : a));
}

function actualizarMapaInteractivo() {
  ciudadButtons.forEach((button, nombre) => {
    button.disabled = true;
    button.className = "city-btn";

    if (ruta.includes(nombre)) button.classList.add("city-visited");
    if (nombre === CONFIG.ciudadInicio) button.classList.add("city-start");
    if (nombre === CONFIG.ciudadDestino)
      button.classList.add("city-destination");
    if (nombre === ciudadActual) button.classList.add("city-current");
  });

  limpiarLineasActivas();
  marcarRutaEnMapa();

  if (!juegoEnCurso || juegoFinalizado) return;

  const vecinas = obtenerVecinas(ciudadActual);
  vecinas.forEach((nombre) => {
    const button = ciudadButtons.get(nombre);
    if (!button) return;
    button.disabled = false;
    button.classList.add("city-available");
  });
}

function limpiarLineasActivas() {
  mapSvg.querySelectorAll(".connection-line").forEach((line) => {
    line.classList.remove("line-active");
  });
}

function marcarRutaEnMapa() {
  for (let i = 0; i < ruta.length - 1; i++) {
    const desde = ruta[i];
    const hasta = ruta[i + 1];
    const line = [...mapSvg.querySelectorAll(".connection-line")].find(
      (element) => {
        const a = element.dataset.desde;
        const b = element.dataset.hasta;
        return (a === desde && b === hasta) || (a === hasta && b === desde);
      },
    );

    if (line) line.classList.add("line-active");
  }
}

function actualizarPanelRuta() {
  ciudadActualTexto.textContent = ciudadActual;
  contadorPasos.textContent = String(saltos.length);
  contadorCosto.textContent = String(costoTotal);
  rutaTexto.textContent = ruta.join(" → ");
  btnDeshacer.disabled =
    !juegoEnCurso || saltos.length === 0 || juegoFinalizado;
}

function renderHistorial() {
  historialBody.innerHTML = "";

  if (saltos.length === 0) {
    historialBody.innerHTML = `<tr><td colspan="4">Todavía no hay saltos.</td></tr>`;
    return;
  }

  saltos.forEach((salto, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${salto.desde}</td>
      <td>${salto.hasta}</td>
      <td><strong>${salto.costo}</strong></td>
    `;
    historialBody.appendChild(tr);
  });
}

function deshacerUltimoPaso() {
  if (!juegoEnCurso || juegoFinalizado || saltos.length === 0) return;

  const ultimo = saltos.pop();
  ruta.pop();
  costoTotal -= ultimo.costo;
  ciudadActual = ruta[ruta.length - 1];

  actualizarPanelRuta();
  renderHistorial();
  actualizarMapaInteractivo();

  resultado.className = "resultado";
  resultado.textContent = "Deshiciste el último salto. Probá otra ruta.";
}

/* =========================
   FINALIZAR Y GUARDAR
========================= */

async function finalizarJuego() {
  juegoEnCurso = false;
  juegoFinalizado = true;
  detenerCronometro();
  actualizarMapaInteractivo();

  btnIniciar.disabled = false;
  btnReiniciar.disabled = false;
  btnDeshacer.disabled = true;

  const eficiente = costoTotal <= interferenciaMaximaActual;

  if (eficiente) {
    resultado.className = "resultado ok";
    resultado.textContent = `Mensaje entregado. Ruta: ${ruta.join(" → ")}. Interferencia total: ${costoTotal}. Límite: ${interferenciaMaximaActual}. Pasos: ${saltos.length}.`;
  } else {
    resultado.className = "resultado error";
    resultado.textContent = `Llegaste a Rivera, pero el mensaje fue interceptado por demasiada interferencia (${costoTotal}). El límite era ${interferenciaMaximaActual}. Probá otra ruta mirando los costos, no solo la distancia.`;
  }

  await guardarIntento(eficiente);
}

async function guardarIntento(eficiente) {
  if (intentoGuardado) return;
  intentoGuardado = true;

  const payload = {
    juego_slug: CONFIG.juegoSlug,
    estudiante_id: estudianteActual.id,
    grupo_id: grupoActual.id,
    inscripcion_id: estudianteActual.inscripcion_id,

    // Reutilizamos campos existentes:
    // total_intercambios = interferencia total.
    // total_adivinanzas = cantidad de saltos entre ciudades.
    total_intercambios: costoTotal,
    total_adivinanzas: saltos.length,

    tiempo_total_segundos: tiempo,
    completado: eficiente,
  };

  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/intentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (!eficiente) {
      resultado.textContent += ` Pista: intentá acercarte al menor costo posible para esta red: ${costoOptimoActual}.`;
    }
  } catch (error) {
    console.error(error);
    resultado.textContent += ` Atención: el juego terminó, pero no se pudo guardar el intento. ${error.message}`;
  }
}

function reiniciarJuego() {
  resetearEstadoJuego(true);
  btnIniciar.disabled = false;
  btnReiniciar.disabled = true;
  btnDeshacer.disabled = true;

  resultado.className = "resultado";
  resultado.textContent =
    "Juego reiniciado. Presioná Iniciar transmisión para volver a comenzar.";
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
