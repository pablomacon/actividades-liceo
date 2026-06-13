const API_BASE_URL = "https://backend-actividades-liceo.vercel.app/api";

const actividadesAlgoritmos = [
  {
    slug: "botellas-algoritmos-01",
    titulo: "Misión 1: Ordenar botellas",
    descripcion:
      "Intercambiá botellas de lugar para encontrar el orden correcto usando pistas.",
    url: "2026/cc7/algoritmos/botellas/index.html",
  },
  {
    slug: "candado-numerico-01",
    titulo: "Misión 2: Candado numérico",
    descripcion:
      "Probá combinaciones, analizá las luces de pista y abrí el candado usando descarte.",
    url: "2026/cc7/algoritmos/candado/index.html",
  },
  {
    slug: "candado-nivel-2",
    titulo: "Misión 3: Candado nivel 2",
    descripcion:
      "Abrí un candado de 4 cifras usando solamente la cantidad de posiciones correctas como pista.",
    url: "2026/cc7/algoritmos/candado-nivel-2/index.html",
  },
  {
    slug: "candado-nivel-3",
    titulo: "Misión 4: Candado nivel 3",
    descripcion:
      "Explorá un candado de 5 cifras sin pistas para comprender la búsqueda por fuerza bruta.",
    url: "2026/cc7/algoritmos/candado-nivel-3/index.html",
  },
  {
    slug: "radar-puerto-01",
    titulo: "Misión 5: El Radar del Puerto",
    descripcion:
      "Encontrá un barco perdido usando pistas de Este/Oeste y reduciendo el espacio de búsqueda.",
    url: "2026/cc7/algoritmos/radar-puerto/index.html",
  },
  {
    slug: null,
    titulo: "Búsqueda y pistas",
    descripcion:
      "Próximamente: nuevos desafíos para comparar estrategias, buscar soluciones y mejorar paso a paso.",
    url: null,
    proxima: true,
  },
];

let mostrarTodasLasActividades = false;
let estadosJuegos = new Map();

document.addEventListener("DOMContentLoaded", () => {
  prepararBotonAlgoritmos();
  renderizarAlgoritmos();
  controlarDisponibilidadJuegos();
});

function prepararBotonAlgoritmos() {
  const boton = document.querySelector("#toggleAlgoritmos");

  if (!boton) return;

  boton.addEventListener("click", () => {
    mostrarTodasLasActividades = !mostrarTodasLasActividades;
    boton.textContent = mostrarTodasLasActividades
      ? "Ver solo actividades activas"
      : "Ver todas las actividades";
    renderizarAlgoritmos();
  });
}

function renderizarAlgoritmos() {
  const contenedor = document.querySelector("#algoritmosGrid");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const actividadesVisibles = actividadesAlgoritmos.filter((actividad) => {
    if (mostrarTodasLasActividades) return true;
    if (actividad.proxima) return false;

    const estado = estadosJuegos.get(actividad.slug);

    // Mientras se consulta la base, se muestran las actividades registradas.
    if (!estado) return true;

    return estado.visible_en_hub !== false && estado.activo === true;
  });

  if (actividadesVisibles.length === 0) {
    contenedor.innerHTML = `
      <article class="card card-algoritmos card-disabled full-width-card">
        <h3>No hay actividades activas</h3>
        <p>El docente habilitará una misión cuando comience el trabajo en clase.</p>
        <span class="btn btn-disabled">Actividad cerrada</span>
      </article>
    `;
    return;
  }

  for (const actividad of actividadesVisibles) {
    contenedor.appendChild(crearTarjetaActividad(actividad));
  }

  aplicarEstadosGuardados();
}

function crearTarjetaActividad(actividad) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card card-algoritmos";

  if (actividad.slug) {
    tarjeta.dataset.juegoSlug = actividad.slug;
  }

  const titulo = document.createElement("h3");
  titulo.textContent = actividad.titulo;

  const descripcion = document.createElement("p");
  descripcion.textContent = actividad.descripcion;

  tarjeta.appendChild(titulo);
  tarjeta.appendChild(descripcion);

  if (actividad.proxima || !actividad.url) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "btn btn-disabled";
    etiqueta.textContent = "Próximamente";
    tarjeta.appendChild(etiqueta);
    return tarjeta;
  }

  const boton = document.createElement("a");
  boton.className = "btn";
  boton.href = actividad.url;
  boton.textContent = "Ingresar";

  const estado = document.createElement("p");
  estado.className = "estado-juego";
  estado.textContent = "Verificando disponibilidad...";

  tarjeta.appendChild(boton);
  tarjeta.appendChild(estado);

  return tarjeta;
}

async function controlarDisponibilidadJuegos() {
  const juegos = actividadesAlgoritmos.filter(
    (actividad) => actividad.slug && !actividad.proxima,
  );

  for (const actividad of juegos) {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/juego?slug=${actividad.slug}`);

      if (!respuesta.ok) {
        estadosJuegos.set(actividad.slug, {
          activo: false,
          visible_en_hub: true,
          mensaje_inactivo: "No disponible por ahora.",
        });
        continue;
      }

      const juego = await respuesta.json();
      estadosJuegos.set(actividad.slug, juego);
    } catch (error) {
      console.error("Error al consultar disponibilidad del juego:", error);
      estadosJuegos.set(actividad.slug, {
        activo: false,
        visible_en_hub: true,
        mensaje_inactivo: "No se pudo verificar la actividad.",
      });
    }
  }

  renderizarAlgoritmos();
}

function aplicarEstadosGuardados() {
  const tarjetas = document.querySelectorAll("[data-juego-slug]");

  for (const tarjeta of tarjetas) {
    const slug = tarjeta.dataset.juegoSlug;
    const boton = tarjeta.querySelector("a.btn");
    const estado = tarjeta.querySelector(".estado-juego");
    const juego = estadosJuegos.get(slug);

    if (!slug || !boton || !estado || !juego) continue;

    if (juego.visible_en_hub === false) {
      tarjeta.remove();
      continue;
    }

    if (!juego.activo) {
      bloquearTarjeta(
        tarjeta,
        boton,
        estado,
        juego.mensaje_inactivo || "Actividad cerrada por el docente.",
      );
      continue;
    }

    habilitarTarjeta(boton, estado, juego.max_intentos_por_estudiante);
  }
}

function bloquearTarjeta(tarjeta, boton, estado, mensaje) {
  tarjeta.classList.add("card-disabled");

  boton.textContent = "Actividad cerrada";
  boton.removeAttribute("href");
  boton.setAttribute("aria-disabled", "true");
  boton.classList.add("btn-disabled");

  estado.textContent = mensaje;
}

function habilitarTarjeta(boton, estado, maxIntentos) {
  const tarjeta = boton.closest(".card");

  if (tarjeta) {
    tarjeta.classList.remove("card-disabled");
  }

  boton.textContent = "Ingresar";
  boton.classList.remove("btn-disabled");
  boton.removeAttribute("aria-disabled");

  if (maxIntentos) {
    estado.textContent = `Disponible. Máximo: ${maxIntentos} intentos.`;
  } else {
    estado.textContent = "Disponible.";
  }
}
