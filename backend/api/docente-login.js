import { sql } from "../db/neon.js";
import { setCors, handleOptions, sendError } from "./_utils.js";
import { verifyPassword, createSessionToken } from "./_auth.js";

async function leerJson(req) {
  try {
    if (req.body && typeof req.body === "object") {
      return req.body;
    }

    if (req.body && typeof req.body === "string") {
      return JSON.parse(req.body);
    }
  } catch (error) {
    // Si Vercel intenta parsear JSON y falla, seguimos con lectura manual.
  }

  let rawBody = "";

  for await (const chunk of req) {
    rawBody += chunk.toString();
  }

  console.log("RAW BODY RECIBIDO:", rawBody);

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendError(res, 405, "Método no permitido.");
  }

  try {
    const body = await leerJson(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendError(res, 400, "Faltan email o contraseña.");
    }

    const docentes = await sql`
      SELECT
        id,
        nombre,
        email,
        rol,
        activo,
        password_hash,
        debe_cambiar_password
      FROM docentes
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1;
    `;

    if (docentes.length === 0) {
      return sendError(res, 401, "Email o contraseña incorrectos.");
    }

    const docente = docentes[0];

    if (!docente.activo) {
      return sendError(res, 403, "Usuario deshabilitado.");
    }

    const passwordOk = verifyPassword(password, docente.password_hash);

    if (!passwordOk) {
      return sendError(res, 401, "Email o contraseña incorrectos.");
    }

    await sql`
      UPDATE docentes
      SET ultimo_login = NOW()
      WHERE id = ${docente.id};
    `;

    const token = createSessionToken(docente);

    return res.status(200).json({
      ok: true,
      token,
      usuario: {
        id: docente.id,
        nombre: docente.nombre,
        email: docente.email,
        rol: docente.rol,
        debe_cambiar_password: docente.debe_cambiar_password,
      },
    });
  } catch (error) {
    console.error("Error en /api/docente-login:", error);

    if (error instanceof SyntaxError) {
      return sendError(res, 400, "JSON inválido.");
    }

    return sendError(res, 500, "Error al iniciar sesión.");
  }
}
