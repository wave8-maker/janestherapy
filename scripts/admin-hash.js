#!/usr/bin/env node
/**
 * Generate the admin password hash.
 *
 * Usage:
 *   node scripts/admin-hash.js '<password>'
 *
 * Prints the line to paste into .env.local, and into the hosting provider's
 * environment variables. The password itself is never stored anywhere — only the
 * scrypt hash, which cannot be turned back into the password.
 *
 * Quote the password so the shell does not eat characters like ! or $.
 */
const { scryptSync, randomBytes } = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/admin-hash.js '<password>'");
  process.exit(1);
}
if (password.length < 12) {
  console.error(
    `\nThat password is ${password.length} characters. Logging in needs nothing else,\n` +
      "so use at least 12 — a phrase of a few unrelated words works well.\n"
  );
  process.exit(1);
}

const N = 16384,
  r = 8,
  p = 1,
  KEYLEN = 64;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p });

console.log("\nAdd this to .env.local and to the hosting environment variables:\n");
console.log(`ADMIN_PASSWORD_HASH=scrypt.${N}.${salt.toString("hex")}.${hash.toString("hex")}`);
console.log("\nThen remove ADMIN_USERS, ADMIN_USERNAME and ADMIN_PASSWORD — they are only");
console.log("still accepted so an existing deployment keeps working until this is set.\n");
