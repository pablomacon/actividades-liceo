import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/generar-hash-password.mjs TU_CONTRASEÑA");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("base64url");
const hash = crypto.scryptSync(password, salt, 64).toString("base64url");

console.log(`scrypt:${salt}:${hash}`);
