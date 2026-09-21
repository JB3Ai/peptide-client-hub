import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { vaultApiMiddleware, vaultGateMiddleware } from "./server/vaultMiddleware.ts";

function vaultDevMiddleware(): Plugin {
  return {
    name: "vault-dev-middleware",
    configureServer(server) {
      server.middlewares.use(vaultApiMiddleware());
      server.middlewares.use(vaultGateMiddleware());
    },
  };
}

export default defineConfig(({ mode }) => {
  // `client/public/vault` is served straight from disk by the dev server, so
  // the PIN-gate middleware needs the same VAULT_* vars the Netlify Edge
  // Functions read in production. Vite doesn't put unprefixed vars on
  // `process.env` for the config/server layer, so load `.env` explicitly.
  const env = loadEnv(mode, import.meta.dirname, ["VAULT_"]);
  process.env.VAULT_PORTAL_PIN ??= env.VAULT_PORTAL_PIN;
  process.env.VAULT_PIN_SECRET ??= env.VAULT_PIN_SECRET;

  return {
    plugins: [react(), tailwindcss(), vaultDevMiddleware()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
