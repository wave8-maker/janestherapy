#!/usr/bin/env node
/**
 * Generate a hashed admin user entry for the ADMIN_USERS env var.
 *
 * Usage:
 *   node scripts/admin-hash.js <username> <password>
 *
 * Prints a JSON fragment you can place inside ADMIN_USERS in .env.local
 * (or your hosting provider's environment variables). Passwords are never
 * stored in plaintext — only the scrypt hash is emitted.
 *
 * To add several users, combine the fragments into one JSON object, e.g.
 *   ADMIN_USERS={"hubo":"scrypt.16384...","hongmei":"scrypt.16384..."}
 */
const { scryptSync, randomBytes } = require("crypto");

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: node scripts/admin-hash.js <username> <password>");
  process.exit(1);
}

const N = 16384, r = 8, p = 1, KEYLEN = 64;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
const stored = `scrypt.${N}.${salt.toString("hex")}.${hash.toString("hex")}`;

console.log("\nUser entry (add inside ADMIN_USERS JSON):");
console.log(`  ${JSON.stringify(username)}: ${JSON.stringify(stored)}`);
console.log("\nFull single-user value:");
console.log(`ADMIN_USERS={${JSON.stringify(username)}:${JSON.stringify(stored)}}`);
console.log("");
