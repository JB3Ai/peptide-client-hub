import type { IncomingMessage, ServerResponse } from "node:http";
import {
  VAULT_COOKIE,
  buildClearedCookie,
  buildSessionCookie,
  createVaultSessionToken,
  isVaultSessionValid,
  parseCookie,
  timingSafeEqual,
} from "../shared/vaultAuth.ts";

type Req = IncomingMessage & { url?: string };
type Res = ServerResponse & { end: ServerResponse["end"] };
type Next = (err?: unknown) => void;

function pathOf(req: Req): string {
  return (req.url ?? "/").split("?")[0];
}

function sendJson(res: Res, status: number, body: unknown, cookie?: string) {
  if (cookie) res.setHeader("set-cookie", cookie);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: Req): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Connect/Express-style middleware that gates static `/vault/*` requests
 * behind a signed session cookie. Used by both the Vite dev server
 * (`vite.config.ts`) and the Express fallback server (`server/index.ts`) so
 * local development matches the Netlify Edge Function behaviour in
 * `netlify/edge-functions/vault-gate.ts`.
 */
export function vaultGateMiddleware() {
  return async (req: Req, res: Res, next: Next) => {
    if (!pathOf(req).startsWith("/vault/")) return next();
    const secret = process.env.VAULT_PIN_SECRET ?? "";
    const token = parseCookie(req.headers.cookie, VAULT_COOKIE);
    const authorized = await isVaultSessionValid(token, secret);
    if (authorized) return next();
    res.statusCode = 401;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(
      "Vault access requires a PIN. Return to the site and unlock the vault to preview or download this file."
    );
  };
}

/** Handles the `/api/vault-login`, `/api/vault-status`, `/api/vault-logout` endpoints. */
export function vaultApiMiddleware() {
  return async (req: Req, res: Res, next: Next) => {
    const path = pathOf(req);
    const pin = process.env.VAULT_PORTAL_PIN;
    const secret = process.env.VAULT_PIN_SECRET ?? "";

    if (path === "/api/vault-status" && req.method === "GET") {
      const token = parseCookie(req.headers.cookie, VAULT_COOKIE);
      const authorized = await isVaultSessionValid(token, secret);
      sendJson(res, 200, { authorized, configured: Boolean(pin && secret) });
      return;
    }

    if (path === "/api/vault-login" && req.method === "POST") {
      if (!pin || !secret) {
        sendJson(res, 503, { error: "Vault PIN is not configured on this deployment." });
        return;
      }
      const body = await readJsonBody(req);
      const submitted = typeof body.pin === "string" ? body.pin.trim() : "";
      if (!submitted || !timingSafeEqual(submitted, pin)) {
        sendJson(res, 401, { error: "Incorrect PIN." });
        return;
      }
      const token = await createVaultSessionToken(secret);
      sendJson(res, 200, { authorized: true }, buildSessionCookie(token));
      return;
    }

    if (path === "/api/vault-logout" && req.method === "POST") {
      sendJson(res, 200, { authorized: false }, buildClearedCookie());
      return;
    }

    next();
  };
}

