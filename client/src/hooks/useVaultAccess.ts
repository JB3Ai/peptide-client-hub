import { useCallback, useEffect, useState } from "react";

type StatusResponse = { authorized: boolean; configured: boolean };

/**
 * Talks to the `/api/vault-status`, `/api/vault-login`, `/api/vault-logout`
 * endpoints (Netlify Edge Functions in production, matching dev-server
 * middleware locally) that gate `/vault/*` documents behind a PIN.
 */
export function useVaultAccess() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/vault-status");
      const data: StatusResponse = await response.json();
      setAuthorized(data.authorized);
      setConfigured(data.configured);
    } catch {
      // Treat network failures as "unauthorized" rather than crashing the UI.
      setAuthorized(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(async (pin: string) => {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/vault-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Incorrect PIN.");
        setPending(false);
        return false;
      }
      setAuthorized(true);
      setPending(false);
      return true;
    } catch {
      setError("Could not reach the server. Try again.");
      setPending(false);
      return false;
    }
  }, []);

  const lock = useCallback(async () => {
    try {
      await fetch("/api/vault-logout", { method: "POST" });
    } finally {
      setAuthorized(false);
    }
  }, []);

  return { authorized, configured, error, pending, unlock, lock, refresh };
}
