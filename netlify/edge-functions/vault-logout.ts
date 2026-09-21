import { buildClearedCookie } from "../../shared/vaultAuth.ts";

export default async () => {
  return Response.json(
    { authorized: false },
    { headers: { "set-cookie": buildClearedCookie() } }
  );
};

export const config = { path: "/api/vault-logout" };
