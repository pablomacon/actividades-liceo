/* Unidad introductoria de bucles en EduBlocks.
 * Compatible con el nuevo index.html de cuatro etapas.
 * No modifica los contratos existentes de config.js ni de la API.
 */
(() => {
  "use strict";

  const CONFIG = window.BUCLES_CONFIG;
  if (!CONFIG) {
    console.error("Falta config.js: window.BUCLES_CONFIG");
    return;
  }

  const $ = (id) => document.getElementById(id);
  const ETAPAS = ["descubrir", "explorar", "construir", "comprobar"];
  const RECORRIDOS = ["inicial", "guiado", "desafio"];
  const img = (archivo, alt) =>
    `<figure class="imagen-didactica"><img src="assets/${archivo}" alt="${alt}" loading="lazy"></figure>`;

  let grupoActual = null;
  let estudianteActual = null;
  let entregado = false;
  let enviando = false;
  let sesion = nuevaSesion();
  let simulacion = { vuelta: 0, total: 5 };
  let respuestaErrorIntentada = false;
  let practicaCorrecta = false;
  let pistaActual = 0;

  function nuevaSesion() {
    return {
      version: 2,
      etapa: "descubrir",
      descubrimiento: false,
      prediccionCorrecta: false,
      prediccionIntentada: false,
      recorridoInicial: null,
      recorridoFinal: null,
      recursos: [],
      pistas: 0,
      practica: { simulaciones: 0, ejerciciosCorrectos: 0 },
      errorIntentado: false,
      errorIdentificadoPractica: false,
      edublocksAbierto: false,
      edublocksProbado: false,
    };
  }

  function claveSesion() {
    return `${CONFIG.sessionKey || "bucles"}:grupo:${grupoActual.id}:estudiante:${estudianteActual.id}`;
  }

  function guardarSesion() {
    if (!grupoActual || !estudianteActual) return;
    try {
      sessionStorage.setItem(claveSesion(), JSON.stringify(sesion));
    } catch (error) {
      console.warn("No se pudo guardar el avance local.", error);
    }
  }

  function restaurarSesion() {
    sesion = nuevaSesion();
    try {
      const previo = JSON.parse(
        sessionStorage.getItem(claveSesion()) || "null",
      );
      if (!previo || typeof previo !== "object" || previo.version !== 2) return;
      sesion = {
        ...sesion,
        etapa: ETAPAS.includes(previo.etapa) ? previo.etapa : "descubrir",
        descubrimiento: previo.descubrimiento === true,
        prediccionCorrecta: previo.prediccionCorrecta === true,
        prediccionIntentada: previo.prediccionIntentada === true,
        recorridoInicial: RECORRIDOS.includes(previo.recorridoInicial)
          ? previo.recorridoInicial
          : null,
        recorridoFinal: RECORRIDOS.includes(previo.recorridoFinal)
          ? previo.recorridoFinal
          : null,
        recursos: Array.isArray(previo.recursos)
          ? previo.recursos.filter((x) => typeof x === "string").slice(0, 20)
          : [],
        pistas: enteroSeguro(previo.pistas, 0, 9999, 0),
        practica: {
          simulaciones: enteroSeguro(previo.practica?.simulaciones, 0, 9999, 0),
          ejerciciosCorrectos: enteroSeguro(
            previo.practica?.ejerciciosCorrectos,
            0,
            9999,
            0,
          ),
        },
        errorIntentado: previo.errorIntentado === true,
        errorIdentificadoPractica: previo.errorIdentificadoPractica === true,
        edublocksAbierto: previo.edublocksAbierto === true,
        edublocksProbado: previo.edublocksProbado === true,
      };
    } catch (error) {
      console.warn("No se pudo restaurar el borrador.", error);
    }
  }

  function enteroSeguro(valor, minimo, maximo, defecto) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero >= minimo && numero <= maximo
      ? numero
      : defecto;
  }

  function texto(id, valor) {
    const el = $(id);
    if (el) el.textContent = valor;
  }

  function mostrar(id, visible) {
    const el = $(id);
    if (el) el.classList.toggle("is-hidden", !visible);
  }

  function registrarRecurso(nombre) {
    if (!sesion.recursos.includes(nombre)) sesion.recursos.push(nombre);
    guardarSesion();
  }

  function seleccionarMarcada(nombre) {
    return document.querySelector(`input[name="${nombre}"]:checked`);
  }

  document.addEventListener("DOMContentLoaded", iniciar);

  async function iniciar() {
    $("grupoSelect").addEventListener("change", cambiarGrupo);
    $("estudianteSelect").addEventListener("change", cambiarEstudiante);
    $("btnEntrar").addEventListener("click", entrarUnidad);
    $("btnVolver").addEventListener("click", volverIngreso);
    $("btnEjecutarManual").addEventListener("click", () =>
      mostrar("salidaManual", true),
    );
    $("btnDescubrir").addEventListener("click", descubrir);
    $("btnContinuarDescubrir").addEventListener("click", () => irA("explorar"));
    $("btnPrediccionInicial").addEventListener("click", predecir);
    $("btnContinuarExplorar").addEventListener("click", () => irA("construir"));
    $("btnContinuarConstruir").addEventListener("click", () =>
      irA("comprobar"),
    );
    $("cantidadVueltas").addEventListener("change", ajustarSimulador);
    $("cantidadVueltas").addEventListener("input", ajustarSimulador);
    $("btnSimAvanzar").addEventListener("click", () => moverSimulacion(1));
    $("btnSimRetroceder").addEventListener("click", () => moverSimulacion(-1));
    $("btnSimReiniciar").addEventListener("click", () => {
      simulacion.vuelta = 0;
      dibujarSimulador();
    });
    $("btnComprobarError").addEventListener("click", comprobarError);
    $("formComprobacion").addEventListener("submit", entregarComprobacion);
    $("btnMostrarPlanB").addEventListener("click", alternarPlanB);
    $("btnImprimirPlanB").addEventListener("click", () => window.print());

    $("edublocksProbado").addEventListener("change", (e) => {
      sesion.edublocksProbado = e.target.checked;
      guardarSesion();
    });

    $("linkEduBlocks").href = CONFIG.eduBlocksUrl;
    $("linkEduBlocks").addEventListener("click", () => {
      sesion.edublocksAbierto = true;
      registrarRecurso("construccion");
    });

    document
      .querySelectorAll(".recorrido-btn")
      .forEach((b) =>
        b.addEventListener("click", () => elegirRecorrido(b.dataset.recorrido)),
      );

    document
      .querySelectorAll("[data-volver]")
      .forEach((b) => b.addEventListener("click", () => irA(b.dataset.volver)));

    document
      .querySelectorAll("[data-etapa]")
      .forEach((b) => b.addEventListener("click", () => irA(b.dataset.etapa)));

    ajustarSimulador();
    await cargarGrupos();
  }

  async function cargarGrupos() {
    try {
      const respuesta = await fetch(`${CONFIG.apiBaseUrl}/grupos`);
      if (!respuesta.ok) throw new Error("No se pudieron cargar los grupos.");
      const grupos = await respuesta.json();
      const select = $("grupoSelect");
      select.replaceChildren(new Option("Selecciona tu grupo", ""));
      grupos.forEach((g) => {
        const opcion = new Option(g.nombre, g.id);
        opcion.dataset.nombre = g.nombre;
        select.add(opcion);
      });
    } catch (error) {
      console.error(error);
      $("grupoSelect").replaceChildren(
        new Option("No se pudieron cargar los grupos", ""),
      );
      texto("estadoIngreso", "No se pudo conectar con la lista de grupos.");
    }
  }

  async function cambiarGrupo() {
    grupoActual = null;
    estudianteActual = null;
    $("btnEntrar").disabled = true;
    $("estudianteSelect").disabled = true;
    $("estudianteSelect").replaceChildren(
      new Option("Cargando estudiantes…", ""),
    );

    const grupoId = Number($("grupoSelect").value);
    if (!grupoId) {
      $("estudianteSelect").replaceChildren(
        new Option("Primero selecciona tu grupo", ""),
      );
      return;
    }

    const nombreGrupo = $("grupoSelect").selectedOptions[0].dataset.nombre;
    grupoActual = { id: grupoId, nombre: nombreGrupo };

    try {
      const respuesta = await fetch(
        `${CONFIG.apiBaseUrl}/estudiantes?grupo_id=${grupoId}`,
      );
      if (!respuesta.ok)
        throw new Error("No se pudieron cargar los estudiantes.");
      const estudiantes = await respuesta.json();
      if (grupoActual?.id !== grupoId) return;

      const select = $("estudianteSelect");
      select.replaceChildren(new Option("Selecciona tu nombre", ""));
      estudiantes.forEach((e) => {
        const opcion = new Option(e.nombre_completo, e.id);
        opcion.dataset.nombre = e.nombre_completo;
        opcion.dataset.inscripcion = e.inscripcion_id || "";
        select.add(opcion);
      });
      select.disabled = false;
      texto("estadoIngreso", "");
    } catch (error) {
      console.error(error);
      texto(
        "estadoIngreso",
        "No se pudieron cargar los estudiantes de este grupo.",
      );
    }
  }

  function cambiarEstudiante() {
    $("btnEntrar").disabled = true;
    estudianteActual = null;
    const opcion = $("estudianteSelect").selectedOptions[0];
    if (!grupoActual || !opcion?.value) return;

    estudianteActual = {
      id: Number(opcion.value),
      nombre: opcion.dataset.nombre,
      inscripcionId: opcion.dataset.inscripcion
        ? Number(opcion.dataset.inscripcion)
        : null,
    };
    $("btnEntrar").disabled = false;
  }

  async function entrarUnidad() {
    if (!grupoActual || !estudianteActual) return;
    $("btnEntrar").disabled = true;
    texto("estadoIngreso", "Verificando disponibilidad…");

    try {
      const params = new URLSearchParams({
        juego_slug: CONFIG.juegoSlug,
        estudiante_id: String(estudianteActual.id),
        grupo_id: String(grupoActual.id),
      });
      const respuesta = await fetch(
        `${CONFIG.apiBaseUrl}/estado-intento?${params}`,
      );
      if (!respuesta.ok) throw new Error("No se pudo verificar la actividad.");
      const estado = await respuesta.json();

      if (!estado.puede_jugar) {
        texto(
          "estadoIngreso",
          estado.motivo ||
            "La actividad no está habilitada para este estudiante.",
        );
        return;
      }

      entregado = false;
      enviando = false;
      restaurarSesion();
      texto("nombreJugador", estudianteActual.nombre);
      texto("grupoJugador", `Grupo: ${grupoActual.nombre}`);
      mostrar("panelIngreso", false);
      mostrar("panelUnidad", true);
      document.querySelector(".layout-game")?.classList.add("solo-unidad");
      restaurarInterfaz();
      irA(sesion.etapa, false);
    } catch (error) {
      console.error(error);
      texto(
        "estadoIngreso",
        "No se pudo verificar la actividad. Avisa al docente.",
      );
    } finally {
      $("btnEntrar").disabled = false;
    }
  }

  function volverIngreso() {
    guardarSesion();
    mostrar("panelUnidad", false);
    mostrar("panelIngreso", true);
    document.querySelector(".layout-game")?.classList.remove("solo-unidad");
    $("formComprobacion").reset();
    mostrar("solucionError", false);
    mostrar("explicacionBucle", false);
    mostrar("salidaManual", false);
    mostrar("planB", false);
    mostrar("btnImprimirPlanB", false);
    $("btnMostrarPlanB").setAttribute("aria-expanded", "false");
    texto("resultadoEntrega", "");
    texto("estadoIngreso", "Selecciona al estudiante que continuará.");
    $("contenidoRecorrido").replaceChildren();
    $("practicaRecorrido").replaceChildren();
    $("pistasRecorrido").replaceChildren();
    sesion = nuevaSesion();
    estudianteActual = null;
    $("estudianteSelect").value = "";
    $("btnEntrar").disabled = true;
    entregado = false;
  }

  function restaurarInterfaz() {
    mostrar("explicacionBucle", sesion.descubrimiento);
    $("btnContinuarDescubrir").disabled = !sesion.descubrimiento;
    $("edublocksProbado").checked = sesion.edublocksProbado;

    if (sesion.prediccionIntentada) {
      texto(
        "feedbackPrediccion",
        sesion.prediccionCorrecta
          ? "Correcto: range(4) repite cuatro veces la instrucción interior."
          : "range(4) significa cuatro vueltas. Puedes volver a intentarlo.",
      );
    } else {
      texto("feedbackPrediccion", "");
    }

    respuestaErrorIntentada = sesion.errorIntentado;
    mostrar("solucionError", respuestaErrorIntentada);
    texto(
      "feedbackError",
      respuestaErrorIntentada
        ? "Recuerda: lo que está fuera del for se ejecuta una sola vez, al terminar el bucle."
        : "",
    );

    if (sesion.recorridoFinal) {
      elegirRecorrido(sesion.recorridoFinal, false);
    } else {
      $("contenidoRecorrido").textContent =
        "Selecciona uno de los tres recorridos para comenzar.";
      $("practicaRecorrido").replaceChildren();
      $("pistasRecorrido").replaceChildren();
      document
        .querySelectorAll(".recorrido-btn")
        .forEach((b) => b.setAttribute("aria-pressed", "false"));
    }

    simulacion = {
      vuelta: 0,
      total: enteroSeguro($("cantidadVueltas").value, 1, 10, 5),
    };
    dibujarSimulador();
    $("btnEnviar").disabled = false;
    texto("resultadoEntrega", "");
  }

  function irA(etapa, recordar = true) {
    if (!ETAPAS.includes(etapa)) return;

    if (!sesion.descubrimiento && etapa !== "descubrir") {
      etapa = "descubrir";
      texto(
        "estadoUnidad",
        "Primero descubre por qué necesitamos una repetición.",
      );
    } else {
      texto(
        "estadoUnidad",
        etapa === "construir"
          ? "Trabaja en dupla. Puedes cambiar de recorrido cuando lo necesites."
          : etapa === "comprobar"
            ? "Esta comprobación es individual y se entrega una sola vez."
            : "Avanza a tu ritmo. No hay cronómetro.",
      );
    }

    document
      .querySelectorAll("[data-etapa-panel]")
      .forEach((panel) =>
        panel.classList.toggle("is-hidden", panel.dataset.etapaPanel !== etapa),
      );

    document.querySelectorAll(".paso-nav").forEach((boton) => {
      const activo = boton.dataset.etapa === etapa;
      boton.classList.toggle("is-active", activo);
      if (activo) boton.setAttribute("aria-current", "step");
      else boton.removeAttribute("aria-current");
    });

    sesion.etapa = etapa;
    if (recordar) guardarSesion();
    $("panelUnidad").scrollIntoView({ behavior: "auto", block: "start" });
  }

  function descubrir() {
    const opcion = seleccionarMarcada("descubrimiento");
    if (!opcion) {
      texto(
        "feedbackDescubrimiento",
        "Selecciona una respuesta antes de continuar.",
      );
      return;
    }

    texto(
      "feedbackDescubrimiento",
      opcion.value === "repetir"
        ? "¡Buena idea! Es más sencillo indicar qué se repite y cuántas veces."
        : "Copiar funciona, pero si necesitamos repetirlo 30 veces sería muy largo. Existe otra forma.",
    );

    sesion.descubrimiento = true;
    guardarSesion();
    mostrar("explicacionBucle", true);
    $("btnContinuarDescubrir").disabled = false;
    $("explicacionBucle").scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function predecir() {
    const opcion = seleccionarMarcada("prediccionInicial");
    if (!opcion) {
      return texto(
        "feedbackPrediccion",
        "Selecciona una respuesta antes de comprobar.",
      );
    }

    sesion.prediccionIntentada = true;
    if (opcion.value === "4") sesion.prediccionCorrecta = true;

    texto(
      "feedbackPrediccion",
      opcion.value === "4"
        ? "¡Correcto! range(4) realiza cuatro vueltas."
        : "Todavía no. Piensa cuántas vueltas indica range(4) y vuelve a probar.",
    );

    registrarRecurso("predicciones");
  }

  function ajustarSimulador() {
    const entrada = $("cantidadVueltas");
    const numero = Number(entrada.value);

    if (!Number.isInteger(numero) || numero < 1 || numero > 10) {
      $("btnSimAvanzar").disabled = true;
      texto("salidaSimulador", "Elige una cantidad entre 1 y 10.");
      return;
    }

    simulacion = { vuelta: 0, total: numero };
    dibujarSimulador();
  }

  function moverSimulacion(cambio) {
    simulacion.vuelta = Math.max(
      0,
      Math.min(simulacion.total, simulacion.vuelta + cambio),
    );

    if (cambio > 0) {
      sesion.practica.simulaciones += 1;
      registrarRecurso("simulador");
    }
    dibujarSimulador();
  }

  function dibujarSimulador() {
    const { vuelta, total } = simulacion;
    texto("codigoSimulador", `for i in range(${total}):\n    print("Hola")`);
    texto("numeroVuelta", String(vuelta));
    texto("valorVariable", vuelta ? String(vuelta - 1) : "—");
    texto("totalVueltas", String(total));
    texto(
      "salidaSimulador",
      vuelta
        ? Array.from({ length: vuelta }, () => "Hola").join("\n")
        : "Todavía no ejecutaste ninguna vuelta.",
    );

    $("btnSimAvanzar").disabled = vuelta >= total;
    $("btnSimRetroceder").disabled = vuelta === 0;
  }

  function elegirRecorrido(recorrido, registrar = true) {
    if (!RECORRIDOS.includes(recorrido)) return;

    if (registrar && !sesion.recorridoInicial) {
      sesion.recorridoInicial = recorrido;
    }
    sesion.recorridoFinal = recorrido;
    pistaActual = 0;
    practicaCorrecta = false;

    document
      .querySelectorAll(".recorrido-btn")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.recorrido === recorrido),
        ),
      );

    const instrucciones = $("contenidoRecorrido");
    const practica = $("practicaRecorrido");
    const pistas = $("pistasRecorrido");

    if (recorrido === "inicial") {
      instrucciones.innerHTML = `
        <h3>Recorrido Inicial · Construyo con ayuda</h3>
        <p><strong>Tu misión:</strong> mostrar «Hola» cinco veces.</p>
        <ol>
          <li>Observa el bloque de la imagen.</li>
          <li>Completa el número de repeticiones.</li>
          <li>Comprueba y después constrúyelo en EduBlocks.</li>
        </ol>
        ${img("bucles-3.png", "Bloque for que contiene una instrucción print para mostrar Hola.")}
        <p><strong>Qué entregar:</strong> el programa funcionando en EduBlocks.</p>`;

      practica.innerHTML = `
        <label for="respuestaInicial">Completa: ¿qué número va en <code>range( )</code> para mostrar Hola cinco veces?</label>
        <div class="codigo-grande">
          <pre><code>for i in range( ? ):\n    print("Hola")</code></pre>
        </div>
        <select id="respuestaInicial">
          <option value="">Elige un número</option>
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="8">8</option>
        </select>
        <button type="button" id="btnPracticaInicial" class="btn-accion">Comprobar mi elección</button>
        <p id="feedbackPractica" class="feedback" aria-live="polite"></p>`;

      $("btnPracticaInicial").addEventListener("click", () => {
        const correcta = $("respuestaInicial").value === "5";
        corregirPractica(
          correcta,
          correcta
            ? "¡Bien! range(5) realiza cinco vueltas. Ahora intenta construirlo en EduBlocks."
            : "Observa: la cantidad de vueltas debe coincidir con la cantidad de mensajes.",
        );
      });

      texto(
        "consignaEduBlocks",
        "Construye un for que muestre «Hola» cinco veces. Puedes mirar la imagen mientras lo haces.",
      );
    } else if (recorrido === "guiado") {
      instrucciones.innerHTML = `
        <h3>Recorrido Guiado · Construyo paso a paso</h3>
        <p><strong>Tu misión:</strong> mostrar «Hola» cuatro veces.</p>
        <ol>
          <li>Busca <strong>Loops</strong> y coloca un <strong>for</strong>.</li>
          <li>Cambia la cantidad a <strong>4</strong>.</li>
          <li>Coloca <code>print("Hola")</code> <strong>dentro</strong>.</li>
          <li>Predice la salida, ejecútalo y compara.</li>
        </ol>
        ${img("bucles-2.png", "Estructura del bloque for en EduBlocks.")}
        <p><strong>Qué entregar:</strong> el programa y una explicación oral de lo que se repite.</p>`;

      practica.innerHTML = `
        <p>Antes de construirlo, decide qué hace este programa:</p>
        <div class="codigo-grande">
          <pre><code>for i in range(4):\n    print("Hola")</code></pre>
        </div>
        <fieldset>
          <legend>¿Cuál será la salida?</legend>
          <label><input type="radio" name="practicaGuiada" value="a"> Hola una vez</label>
          <label><input type="radio" name="practicaGuiada" value="b"> Hola cuatro veces</label>
          <label><input type="radio" name="practicaGuiada" value="c"> Los números 0, 1, 2 y 3</label>
        </fieldset>
        <button type="button" id="btnPracticaGuiada" class="btn-accion">Comprobar predicción</button>
        <p id="feedbackPractica" class="feedback" aria-live="polite"></p>`;

      $("btnPracticaGuiada").addEventListener("click", () => {
        const opcion = seleccionarMarcada("practicaGuiada");
        if (!opcion)
          return texto("feedbackPractica", "Selecciona una respuesta.");
        corregirPractica(
          opcion.value === "b",
          opcion.value === "b"
            ? "Correcto. El print está dentro del for y se ejecuta cuatro veces."
            : "Vuelve a mirar qué instrucción está dentro del for y cuántas vueltas indica range(4).",
        );
      });

      texto(
        "consignaEduBlocks",
        "Sin copiar un programa terminado: coloca for, define cuatro vueltas, agrega print dentro y comprueba la salida.",
      );
    } else {
      instrucciones.innerHTML = `
        <h3>Recorrido Desafío · Resuelvo con autonomía</h3>
        <p><strong>Tu misión:</strong> pregunta al usuario cuántas veces quiere ver un mensaje y repítelo.</p>
        <ol>
          <li>Solicita una cantidad con <code>input()</code> y conviértela con <code>int()</code>.</li>
          <li>Utiliza esa cantidad en <code>range()</code>.</li>
          <li>Prueba el programa con 2, 4 y 6.</li>
          <li>Explica qué parte cambia y cuál se repite.</li>
        </ol>
        <p><strong>Qué entregar:</strong> un programa que funcione con tres cantidades distintas y una explicación breve.</p>`;

      practica.innerHTML = `
        <p>Antes de abrir EduBlocks, prueba tu razonamiento:</p>
        <div class="codigo-grande">
          <pre><code>cantidad = int(input("¿Cuántas veces? "))\nfor i in range(cantidad):\n    print("Hola")</code></pre>
        </div>
        <label for="cantidadDesafio">Si el usuario escribe este número:</label>
        <input id="cantidadDesafio" type="number" min="0" max="20" value="3">
        <button type="button" id="btnPracticaDesafio" class="btn-accion">Probar mi predicción</button>
        <p id="feedbackPractica" class="feedback" aria-live="polite"></p>
        <pre id="salidaDesafio" class="consola-salida" aria-live="polite"></pre>`;

      $("btnPracticaDesafio").addEventListener("click", () => {
        const entrada = $("cantidadDesafio").value.trim();
        const cantidad = Number(entrada);
        if (
          entrada === "" ||
          !Number.isInteger(cantidad) ||
          cantidad < 0 ||
          cantidad > 20
        ) {
          return texto(
            "feedbackPractica",
            "Elige un número entero entre 0 y 20.",
          );
        }

        $("salidaDesafio").textContent = cantidad
          ? Array.from({ length: cantidad }, () => "Hola").join("\n")
          : "(No aparece ningún mensaje.)";

        corregirPractica(
          true,
          `Con ${cantidad}, el programa realiza ${cantidad} repeticiones. Prueba otros valores y construye tu solución.`,
        );
      });

      texto(
        "consignaEduBlocks",
        "Crea tu propia solución usando input(), int(), for y print(). Prueba con 2, 4 y 6.",
      );
    }

    pistas.innerHTML = `
      <button id="btnPistaRecorrido" class="btn-secondary" type="button">Necesito una pista</button>
      <p id="textoPistaRecorrido" class="feedback" aria-live="polite"></p>`;

    $("btnPistaRecorrido").addEventListener("click", () => darPista(recorrido));
    if (registrar) guardarSesion();
  }

  function corregirPractica(correcta, mensaje) {
    texto("feedbackPractica", mensaje);
    if (correcta && !practicaCorrecta) {
      practicaCorrecta = true;
      sesion.practica.ejerciciosCorrectos += 1;
      guardarSesion();
    }
  }

  function darPista(recorrido) {
    const pistas = {
      inicial: [
        "Mira cuántas veces necesitas mostrar «Hola».",
        "El número que va en range() es la cantidad de vueltas.",
        "Si quieres cinco mensajes, usa range(5).",
      ],
      guiado: [
        "Primero busca el bloque for en Loops.",
        "El número 4 indica cuatro vueltas. Coloca print dentro del for.",
        'Cada vuelta ejecuta print("Hola") una vez.',
      ],
      desafio: [
        "Recuerda: input() devuelve texto; int() permite convertirlo a entero.",
        "Guarda la cantidad en una variable y escribe range(cantidad).",
        'Ejemplo de inicio: cantidad = int(input("¿Cuántas veces? "))',
      ],
    };

    const indice = Math.min(pistaActual, pistas[recorrido].length - 1);
    texto("textoPistaRecorrido", pistas[recorrido][indice]);
    pistaActual += 1;
    sesion.pistas += 1;
    guardarSesion();
  }

  function comprobarError() {
    const opcion = seleccionarMarcada("errorBloques");
    if (!opcion) {
      return texto(
        "feedbackError",
        "Selecciona una respuesta antes de comprobar.",
      );
    }

    respuestaErrorIntentada = true;
    sesion.errorIntentado = true;
    if (opcion.value === "interior") sesion.errorIdentificadoPractica = true;

    texto(
      "feedbackError",
      opcion.value === "interior"
        ? "¡Correcto! print debe estar dentro del for para ejecutarse en cada vuelta."
        : "La clave es la posición del bloque print. Observa la explicación y vuelve a probar.",
    );

    mostrar("solucionError", true);
    registrarRecurso("depuracion");
  }

  function alternarPlanB() {
    const mostrarPlan = $("planB").classList.contains("is-hidden");
    mostrar("planB", mostrarPlan);
    mostrar("btnImprimirPlanB", mostrarPlan);
    $("btnMostrarPlanB").setAttribute("aria-expanded", String(mostrarPlan));
    if (mostrarPlan) {
      $("planB").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function entregarComprobacion(evento) {
    evento.preventDefault();
    if (
      entregado ||
      enviando ||
      !estudianteActual ||
      !grupoActual ||
      !$("formComprobacion").reportValidity()
    )
      return;

    const respuestas = new FormData($("formComprobacion"));
    const aciertos =
      Number(respuestas.get("q1") === "a") +
      Number(respuestas.get("q2") === "b") +
      Number(respuestas.get("q3") === "a");


const evidencia = {
  version: 1,
  recorrido_inicial: sesion.recorridoInicial,
  recorrido_final: sesion.recorridoFinal,
  uso_pistas: sesion.pistas,
  repeticion_comprendida: respuestas.get("q1") === "a",
  prediccion_correcta: respuestas.get("q2") === "b",
  error_identificado: respuestas.get("q3") === "a",
  comprobacion: {
    aciertos,
    total: 3
  },
  edublocks_abierto: sesion.edublocksAbierto,
  edublocks_declarado_probado: $("edublocksProbado").checked
};


    enviando = true;
    $("btnEnviar").disabled = true;
    $("resultadoEntrega").className = "resultado";
    texto("resultadoEntrega", "Guardando comprobación…");

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
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar la comprobación.");
      }

      entregado = true;
      try {
        sessionStorage.removeItem(claveSesion());
      } catch {
        /* No es crítico. */
      }

      $("resultadoEntrega").className = "resultado ok";
      texto(
        "resultadoEntrega",
        `Comprobación entregada: ${aciertos} de 3 respuestas correctas. Puedes seguir practicando.`,
      );
    } catch (error) {
      console.error(error);
      $("resultadoEntrega").className = "resultado error";
      texto(
        "resultadoEntrega",
        error.message ||
          "No se pudo guardar. Revisa la conexión y avisa al docente.",
      );
      $("btnEnviar").disabled = false;
    } finally {
      enviando = false;
    }
  }
})();
