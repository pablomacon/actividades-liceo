const API_BASE_URL = "https://backend-actividades-liceo.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  controlarDisponibilidadJuegos();
});

async function controlarDisponibilidadJuegos() {
  const tarjetas = document.querySelectorAll("[data-juego-slug]");

  for (const tarjeta of tarjetas) {
    const slug = tarjeta.dataset.juegoSlug;
    const boton = tarjeta.querySelector("a.btn");
    const estado = tarjeta.querySelector(".estado-juego");

    if (!slug || !boton || !estado) continue;

    try {
      estado.textContent = "Verificando disponibilidad...";

      const respuesta = await fetch(`${API_BASE_URL}/juego?slug=${slug}`);

      if (!respuesta.ok) {
        bloquearTarjeta(tarjeta, boton, estado, "No disponible por ahora.");
        continue;
      }

      const juego = await respuesta.json();

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
    } catch (error) {
      console.error("Error al consultar disponibilidad del juego:", error);

      bloquearTarjeta(
        tarjeta,
        boton,
        estado,
        "No se pudo verificar la actividad.",
      );
    }
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
  boton.textContent = "Ingresar";
  boton.classList.remove("btn-disabled");
  boton.removeAttribute("aria-disabled");

  if (maxIntentos) {
    estado.textContent = `Disponible. Máximo: ${maxIntentos} intentos.`;
  } else {
    estado.textContent = "Disponible.";
  }
}
