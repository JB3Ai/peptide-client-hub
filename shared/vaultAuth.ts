/**
 * Shared PIN-gate primitives for the document vault.
 *
 * This module only uses standard Web Crypto / Web APIs so the exact same
 * code runs unmodified in three places:
 *  - Netlify Edge Functions (Deno runtime, production)
 *  - the local Vite dev server middleware (Node, `pnpm dev`)
 *  - the Express fallback server (Node, `pnpm start`)
 */

export const VAULT_COOKIE = "vault_session";
export const VAULT_SESSION_HOURS = 12;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Constant-time string comparison (length is not hidden, which is fine for short PINs/signatures). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Creates a signed, expiring session token: `v1.<expiresAtMs>.<signature>`. */
export async function createVaultSessionToken(
  secret: string,
  hours = VAULT_SESSION_HOURS
): Promise<string> {
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const payload = `v1.${expiresAt}`;
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

/** Verifies a session token's signature and expiry. */
export async function isVaultSessionValid(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresAtRaw, signature] = parts;
  if (version !== "v1") return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const payload = `${version}.${expiresAtRaw}`;
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(payload)
  );
  return timingSafeEqual(toBase64Url(expectedSignature), signature);
}

export function parseCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function buildSessionCookie(token: string, hours = VAULT_SESSION_HOURS): string {
  const secureAttr = runsOnNetlifyEdge() ? " Secure;" : "";
  return `${VAULT_COOKIE}=${token}; Path=/; HttpOnly;${secureAttr} SameSite=Lax; Max-Age=${hours * 60 * 60}`;
}

export function buildClearedCookie(): string {
  const secureAttr = runsOnNetlifyEdge() ? " Secure;" : "";
  return `${VAULT_COOKIE}=; Path=/; HttpOnly;${secureAttr} SameSite=Lax; Max-Age=0`;
}

function runsOnNetlifyEdge(): boolean {
  // Netlify Edge Functions run under Deno (always HTTPS in production); the
  // Node dev server and Express fallback are not guaranteed to terminate TLS.
  return typeof (globalThis as Record<string, unknown>).Deno !== "undefined";
}
