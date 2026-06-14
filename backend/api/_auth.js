import crypto from "node:crypto";

const TOKEN_DURATION_SECONDS = 60 * 60; // 1 hora

function getSecret() {
  const secret = process.env.DOCENTE_JWT_SECRET;

  if (!secret) {
    throw new Error("Falta configurar DOCENTE_JWT_SECRET.");
  }

  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64url");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("scrypt:")) {
    return false;
  }

  const [, salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const calculatedHash = crypto.scryptSync(password, salt, 64);

  const storedBuffer = Buffer.from(hash, "base64url");

  if (storedBuffer.length !== calculatedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, calculatedHash);
}

export function createSessionToken(docente) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    sub: docente.id,
    nombre: docente.nombre,
    email: docente.email,
    rol: docente.rol,
    iat: now,
    exp: now + TOKEN_DURATION_SECONDS,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token) {
    throw new Error("Falta token.");
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Token inválido.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken);

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw new Error("Firma inválida.");
  }

  const payload = JSON.parse(fromBase64url(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    throw new Error("Sesión vencida.");
  }

  return payload;
}

export function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}
