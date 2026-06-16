/**
 * Signed, expiring admin session tokens.
 *
 * A token is `<payloadB64url>.<hmacB64url>` where the payload is JSON
 * `{ u: username, exp: unixSeconds }` and the signature is
 * HMAC-SHA256(payload, ADMIN_SESSION_SECRET).
 *
 * Implemented with the Web Crypto API (globalThis.crypto.subtle) so the same
 * code runs in Node route handlers AND the Edge middleware runtime.
 * This file must NOT import next/headers or any Node-only module.
 */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

// Dev-only fallback so local login works without a configured secret.
// In production a missing ADMIN_SESSION_SECRET fails closed (no valid sessions).
const DEV_FALLBACK_SECRET = "janes-therapy-dev-only-not-for-production";

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_SECRET;
  return "";
}

// ── base64url helpers ───────────────────────────────────────────────────────
function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(s: string): string {
  return bytesToB64url(new TextEncoder().encode(s));
}
function b64urlToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return bytesToB64url(new Uint8Array(sig));
}

// constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = getSecret();
  const payload = JSON.stringify({
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const payloadB64 = strToB64url(payload);
  const sig = await sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = await sign(payloadB64, secret);
  if (!timingSafeEqual(sig, expected)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
