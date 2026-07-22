/**
 * Admin password verification (no database, no username).
 *
 * There is one person behind this door, so asking who they are added a field to
 * fill in without adding anything to prove. The password is the whole credential.
 *
 * Configure it as a scrypt hash — generate one with `node scripts/admin-hash.js`:
 *   ADMIN_PASSWORD_HASH=scrypt.16384.<saltHex>.<hashHex>
 *
 * The older per-user settings still work, so an existing deployment keeps letting
 * its owner in on the same password while ADMIN_PASSWORD_HASH is being set up:
 * any password in ADMIN_USERS, or a plaintext ADMIN_PASSWORD, is accepted.
 *
 * Node-only (uses node:crypto scrypt). Imported by the login route, which runs in
 * the Node.js runtime — never by the proxy.
 */
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 64;

/** Produce a storable hash string: `scrypt.<N>.<saltHex>.<hashHex>` (no `$`, env-safe). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  return `scrypt.${SCRYPT_N}.${salt.toString("hex")}.${hash.toString("hex")}`;
}

function verifyHash(password: string, stored: string): boolean {
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = parseInt(parts[1], 10);
  if (!Number.isFinite(n)) return false;
  let salt: Buffer, expected: Buffer;
  try {
    salt = Buffer.from(parts[2], "hex");
    expected = Buffer.from(parts[3], "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, { N: n, r: SCRYPT_r, p: SCRYPT_p });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function safeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Every hash this deployment accepts, the preferred one first. */
function configuredHashes(): string[] {
  const hashes: string[] = [];
  const single = process.env.ADMIN_PASSWORD_HASH;
  if (single) hashes.push(single);

  const raw = process.env.ADMIN_USERS;
  if (raw) {
    try {
      hashes.push(...Object.values(JSON.parse(raw) as Record<string, string>));
    } catch {
      /* malformed ADMIN_USERS — ignore it */
    }
  }
  return hashes;
}

export function verifyPassword(password: string): boolean {
  if (typeof password !== "string" || !password) return false;

  // Every configured hash is checked rather than stopping at the first match, so
  // the work done — and the time taken — does not reveal which one was right.
  let matched = false;
  for (const stored of configuredHashes()) {
    if (verifyHash(password, stored)) matched = true;
  }
  if (matched) return true;

  const legacyPlaintext = process.env.ADMIN_PASSWORD;
  if (legacyPlaintext && safeStrEqual(password, legacyPlaintext)) return true;

  return false;
}
