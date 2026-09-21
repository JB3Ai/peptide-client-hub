import {
  VAULT_COOKIE,
  isVaultSessionValid,
  parseCookie,
} from "../../shared/vaultAuth.ts";

export default async (request: Request) => {
  const secret = Deno.env.get("VAULT_PIN_SECRET") ?? "";
  const token = parseCookie(request.headers.get("cookie"), VAULT_COOKIE);
  const authorized = await isVaultSessionValid(token, secret);
  const configured = Boolean(Deno.env.get("VAULT_PORTAL_PIN") && secret);
  return Response.json({ authorized, configured });
};

export const config = { path: "/api/vault-status" };
