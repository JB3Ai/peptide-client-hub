# Private vault storage on Cloudflare R2

The frontend is configured for Cloudflare Workers static assets in wrangler.json. R2 and a protected download Worker are not connected yet. Creating a bucket alone will not activate downloads.

## Storage allowance

R2 Standard includes 10 GB-month storage, 1 million Class A operations and 10 million Class B operations monthly, with no egress charges. Usage above the allowance is billed. This vault currently has 27 files totaling about 5.7 MB. Account usage from other projects shares the allowance.

Official pricing: https://developers.cloudflare.com/r2/pricing/

## Dashboard setup

1. Sign in to Cloudflare and open Storage & databases > R2 object storage. Activate an R2 subscription if prompted, reviewing billing details.
2. Create a bucket named peptide-client-vault. Choose Standard storage.
3. Keep public access disabled: do not enable the r2.dev public development URL or attach a public bucket domain.
4. Open the bucket and create the prefix vault/. Upload the 27 files from the local vault-local folder into that prefix, keeping their URL-safe filenames. For example, the object key must be vault/peptide-six-month-budget-forecast.csv. Original download filenames remain in client/src/data/vaultDocuments.json.
5. Under Workers & Pages, select the project's Worker and add an R2 bucket binding named VAULT pointing to peptide-client-vault. Record the same binding in wrangler.json when implementing the download Worker so deployments preserve it.

Official setup: https://developers.cloudflare.com/r2/get-started/
Worker bindings: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
Public access behavior: https://developers.cloudflare.com/r2/buckets/public-buckets/

## Required download integration (not implemented yet)

- Add a Worker handler for /vault/* which validates the signed-in user before reading objects through the VAULT binding.
- For a client workspace, protect the hostname with Cloudflare Access and an allow policy for approved email addresses. The Worker must validate the Access JWT signature, issuer and audience; trusting a request header alone is insufficient. Protect or disable alternative workers.dev and preview routes too.
- Restrict object keys to the document manifest, return 404 for unknown files, and set Content-Disposition: attachment with the original filename and Cache-Control: private, no-store.
- Route /vault/* to the Worker before the static-asset SPA fallback. Otherwise a missing document could return index.html instead of a file.
- Only after the authenticated endpoint works, set VITE_VAULT_BASE_URL to its HTTPS origin in the frontend build environment, then rebuild. The UI appends each manifest path (/vault/...). Prefer the same origin for straightforward session handling.
- Leave that variable unset until integration is complete. The UI will show Storage setup pending instead of broken downloads.
- Do not place R2 access keys, tokens or other secrets in VITE_ variables. A Worker R2 binding avoids exposing storage credentials to the browser.

Before enabling downloads, test an allowed login, a denied login, unauthenticated access, a missing object, PDF and Office downloads, and mobile navigation. Worker and Access plan usage is separate from R2 storage pricing.

## Repository and local files

- vault-local/: local upload source; ignored by Git and excluded from static builds.
- evidence/: existing local originals; document files ignored by Git.
- client/src/data/vaultDocuments.json: filenames, labels and paths only, intentionally kept with application code.
- Fonts and favicon are application assets and stay in Git.
- dist/ is generated and ignored. Never use it as the only copy of uploaded documents.

Older evidence documents were already present in origin/main history before this update. Removing tracked files does not purge historical commits. A separate, coordinated history cleanup is required if those older copies must be removed from GitHub entirely.