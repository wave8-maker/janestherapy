/**
 * Admin credential verification (no database).
 *
 * Hashed accounts are stored in the ADMIN_USERS env var as JSON:
 *   ADMIN_USERS={"hubo":"scrypt.16384.<saltHex>.<hashHex>", ...}
 * Passwords are hashed with scrypt; only the hash is ever stored.
 *
 * For backward compatibility, a single legacy plaintext account configured via
 * ADMIN_USERNAME / ADMIN_PASSWORD is still accepted (used by the existing
 * production deployment until it is migrated to ADMIN_USERS).
 *
 * Node-only (uses node:crypto scrypt). Imported by the login route, which runs
 * in the Node.js runtime — never by the Edge middleware.
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

export function verifyCredentials(username: string, password: string): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;
  if (!username || !password) return false;

  // 1) Hashed accounts (preferred)
  const raw = process.env.ADMIN_USERS;
  if (raw) {
    try {
      const users = JSON.parse(raw) as Record<string, string>;
      const stored = users[username];
      if (stored && verifyHash(password, stored)) return true;
    } catch {
      /* malformed ADMIN_USERS — ignore and fall through */
    }
  }

  // 2) Legacy single plaintext account (backward compatibility)
  const legacyUser = process.env.ADMIN_USERNAME;
  const legacyPass = process.env.ADMIN_PASSWORD;
  if (legacyUser && legacyPass) {
    // evaluate both comparisons to avoid early-exit timing differences
    const uOk = safeStrEqual(username, legacyUser);
    const pOk = safeStrEqual(password, legacyPass);
    if (uOk && pOk) return true;
  }

  return false;
}
