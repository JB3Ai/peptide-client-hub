import {
  buildSessionCookie,
  createVaultSessionToken,
  timingSafeEqual,
} from "../../shared/vaultAuth.ts";

export default async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = Deno.env.get("VAULT_PORTAL_PIN");
  const secret = Deno.env.get("VAULT_PIN_SECRET");
  if (!pin || !secret) {
    return Response.json(
      { error: "Vault PIN is not configured on this deployment." },
      { status: 503 }
    );
  }

  let body: { pin?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const submitted = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!submitted || !timingSafeEqual(submitted, pin)) {
    return Response.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const token = await createVaultSessionToken(secret);
  return Response.json(
    { authorized: true },
    { headers: { "set-cookie": buildSessionCookie(token) } }
  );
};

export const config = { path: "/api/vault-login" };
