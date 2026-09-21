# Document vault

All vault documents are bundled directly into the static build from
`client/public/vault/` (source-controlled) and listed in
`client/src/data/vaultDocuments.json`. There is no Cloudflare R2 / Worker
storage layer — that earlier plan (see git history for
`CLOUDFLARE_STORAGE_SETUP.md`) has been replaced by this simpler approach.

## Access control

`/vault/*` and the marketing site content are gated separately:

- The **site** (workstream pages, decisions, etc.) is public.
- The **vault** (previews and downloads) requires a PIN, enforced by:
  - `netlify/edge-functions/vault-gate.ts` in production (Netlify Edge
    Functions), and
  - `server/vaultMiddleware.ts`, wired into both `vite.config.ts` (for
    `pnpm dev`) and `server/index.ts` (for the Express fallback server), for
    local parity.
- `shared/vaultAuth.ts` implements the signed-cookie session logic shared by
  both runtimes (Web Crypto only, so it works under both Node and Deno).

Set `VAULT_PORTAL_PIN` and `VAULT_PIN_SECRET` (see `.env.example`) locally and
in the Netlify site's environment variables. Without them, the vault stays
locked and login attempts return a clear "not configured" error instead of a
silent failure.

## Adding a new document

1. Add the file to `client/public/vault/` with a URL-safe (kebab-case, ASCII)
   filename.
2. Add an entry to `client/src/data/vaultDocuments.json` with a matching
   `url: "/vault/<filename>"`.
3. Rebuild — Vite copies everything in `client/public/` into the build output
   automatically, so no other wiring is required.
