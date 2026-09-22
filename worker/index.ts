import {
  VAULT_COOKIE,
  buildClearedCookie,
  buildSessionCookie,
  createVaultSessionToken,
  isVaultSessionValid,
  parseCookie,
  resolvePinSecret,
  resolvePortalPin,
  timingSafeEqual,
} from "../shared/vaultAuth.ts";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  VAULT_PORTAL_PIN?: string;
  VAULT_PIN_SECRET?: string;
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
  });
}

/**
 * Mirrors `netlify/edge-functions/vault-{status,login,logout}.ts` and
 * `server/vaultMiddleware.ts` so the PIN gate behaves identically on
 * Cloudflare Workers, Netlify Edge Functions, and local/Node hosting.
 */
async function handleApi(request: Request, env: Env, pathname: string): Promise<Response> {
  const secret = resolvePinSecret(env.VAULT_PIN_SECRET);

  if (pathname === "/api/vault-status") {
    const token = parseCookie(request.headers.get("cookie"), VAULT_COOKIE);
    const authorized = await isVaultSessionValid(token, secret);
    return json({ authorized, configured: true });
  }

  if (pathname === "/api/vault-login") {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    const pin = resolvePortalPin(env.VAULT_PORTAL_PIN);
    let body: { pin?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, { status: 400 });
    }
    const submitted = typeof body.pin === "string" ? body.pin.trim() : "";
    if (!submitted || !timingSafeEqual(submitted, pin)) {
      return json({ error: "Incorrect PIN." }, { status: 401 });
    }
    const token = await createVaultSessionToken(secret);
    return json({ authorized: true }, { headers: { "set-cookie": buildSessionCookie(token) } });
  }

  if (pathname === "/api/vault-logout") {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    return json({ authorized: false }, { headers: { "set-cookie": buildClearedCookie() } });
  }

  return new Response("Not found", { status: 404 });
}

/** Gates direct requests for vault files behind the same signed session cookie. */
async function handleVaultAsset(request: Request, env: Env): Promise<Response> {
  const secret = resolvePinSecret(env.VAULT_PIN_SECRET);
  const token = parseCookie(request.headers.get("cookie"), VAULT_COOKIE);
  const authorized = await isVaultSessionValid(token, secret);
  if (!authorized) {
    return new Response(
      "Vault access requires a PIN. Return to the site and unlock the vault to preview or download this file.",
      { status: 401, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      return handleApi(request, env, pathname);
    }
    if (pathname.startsWith("/vault/")) {
      return handleVaultAsset(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
