import {
  VAULT_COOKIE,
  isVaultSessionValid,
  parseCookie,
} from "../../shared/vaultAuth.ts";
import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const secret = Deno.env.get("VAULT_PIN_SECRET") ?? "";
  const token = parseCookie(request.headers.get("cookie"), VAULT_COOKIE);
  const authorized = await isVaultSessionValid(token, secret);
  if (authorized) return context.next();

  return new Response(
    "Vault access requires a PIN. Return to the site and unlock the vault to preview or download this file.",
    { status: 401, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};

export const config = { path: "/vault/*" };
