const DOCENTE_API_BASE = "https://backend-actividades-liceo.vercel.app/api";

const DOCENTE_TOKEN_KEY = "docente_token";
const DOCENTE_USUARIO_KEY = "docente_usuario";
const DOCENTE_LAST_ACTIVITY_KEY = "docente_last_activity";
const DOCENTE_INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos

function guardarSesion({ token, usuario }) {
  localStorage.setItem(DOCENTE_TOKEN_KEY, token);
  localStorage.setItem(DOCENTE_USUARIO_KEY, JSON.stringify(usuario));
  registrarActividad();
}

function obtenerToken() {
  return localStorage.getItem(DOCENTE_TOKEN_KEY);
}

function obtenerUsuarioGuardado() {
  try {
    const data = localStorage.getItem(DOCENTE_USUARIO_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

function registrarActividad() {
  localStorage.setItem(DOCENTE_LAST_ACTIVITY_KEY, String(Date.now()));
}

function sesionInactiva() {
  const ultimoRegistro = Number(localStorage.getItem(DOCENTE_LAST_ACTIVITY_KEY) || 0);

  if (!ultimoRegistro) {
    return false;
  }

  return Date.now() - ultimoRegistro > DOCENTE_INACTIVITY_LIMIT_MS;
}

function cerrarSesion(motivo = "") {
  localStorage.removeItem(DOCENTE_TOKEN_KEY);
  localStorage.removeItem(DOCENTE_USUARIO_KEY);
  localStorage.removeItem(DOCENTE_LAST_ACTIVITY_KEY);

  const destino = motivo
    ? `login.html?motivo=${encodeURIComponent(motivo)}`
    : "login.html";

  window.location.href = destino;
}

async function docenteFetch(path, options = {}) {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${DOCENTE_API_BASE}${path}`, {
    ...options,
    headers,
  });

  return response;
}

async function verificarSesion() {
  const token = obtenerToken();

  if (!token) {
    return null;
  }

  if (sesionInactiva()) {
    cerrarSesion("Sesión cerrada por inactividad.");
    return null;
  }

  const response = await docenteFetch("/docente-me", {
    method: "GET",
  });

  if (!response.ok) {
    cerrarSesion("Sesión vencida o inválida.");
    return null;
  }

  const data = await response.json();
  registrarActividad();
  localStorage.setItem(DOCENTE_USUARIO_KEY, JSON.stringify(data.usuario));
  return data.usuario;
}

function iniciarControlInactividad() {
  const eventos = ["click", "keydown", "mousemove", "scroll", "touchstart"];

  eventos.forEach((evento) => {
    window.addEventListener(evento, registrarActividad, { passive: true });
  });

  window.setInterval(() => {
    if (obtenerToken() && sesionInactiva()) {
      cerrarSesion("Sesión cerrada por inactividad.");
    }
  }, 30 * 1000);
}

async function iniciarLoginDocente() {
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const mensaje = document.querySelector("#mensajeLogin");
  const motivo = new URLSearchParams(window.location.search).get("motivo");

  if (motivo && mensaje) {
    mensaje.textContent = motivo;
    mensaje.className = "mensaje aviso";
  }

  const token = obtenerToken();
  if (token && !sesionInactiva()) {
    window.location.href = "resultados.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    mensaje.textContent = "Verificando datos...";
    mensaje.className = "mensaje aviso";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const response = await fetch(`${DOCENTE_API_BASE}/docente-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        mensaje.textContent = data.error || "No se pudo iniciar sesión.";
        mensaje.className = "mensaje error";
        return;
      }

      guardarSesion({ token: data.token, usuario: data.usuario });
      window.location.href = "resultados.html";
    } catch (error) {
      mensaje.textContent = "No se pudo conectar con el servidor.";
      mensaje.className = "mensaje error";
    }
  });
}

async function iniciarPanelProtegido() {
  iniciarControlInactividad();

  const usuarioGuardado = obtenerUsuarioGuardado();
  const nombreElemento = document.querySelector("#nombreUsuario");
  const rolElemento = document.querySelector("#rolUsuario");
  const estadoElemento = document.querySelector("#estadoSesion");
  const cerrarBtn = document.querySelector("#cerrarSesionBtn");

  if (usuarioGuardado) {
    nombreElemento.textContent = usuarioGuardado.nombre || "Usuario docente";
    rolElemento.textContent = usuarioGuardado.rol || "rol no indicado";
  }

  cerrarBtn.addEventListener("click", () => cerrarSesion());

  try {
    const usuario = await verificarSesion();

    if (!usuario) return;

    if (!["admin", "practicante"].includes(usuario.rol)) {
      cerrarSesion("Tu usuario no tiene permisos para acceder al panel docente.");
      return;
    }

    nombreElemento.textContent = usuario.nombre;
    rolElemento.textContent = usuario.rol;
    estadoElemento.textContent = "Sesión verificada correctamente.";
    estadoElemento.className = "mensaje exito";
  } catch (error) {
    cerrarSesion("No se pudo verificar la sesión.");
  }
}
