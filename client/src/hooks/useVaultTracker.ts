import { useCallback, useEffect, useState } from "react";

export type VaultActivity = Record<
  string,
  { viewedAt?: string; downloadedAt?: string }
>;

const STORAGE_KEY = "georgie-vault-tracker-v1";

function readActivity(): VaultActivity {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/**
 * Persistent (localStorage) record of which vault documents this browser has
 * previewed or downloaded, and when. Purely a per-device convenience tracker
 * — it is not synced anywhere and does not affect access control.
 */
export function useVaultTracker() {
  const [activity, setActivity] = useState<VaultActivity>(readActivity);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    } catch {
      // Ignore quota / private-mode failures; tracking is best-effort only.
    }
  }, [activity]);

  const markViewed = useCallback((id: string) => {
    setActivity(prev => ({
      ...prev,
      [id]: { ...prev[id], viewedAt: new Date().toISOString() },
    }));
  }, []);

  const markDownloaded = useCallback((id: string) => {
    setActivity(prev => ({
      ...prev,
      [id]: { ...prev[id], downloadedAt: new Date().toISOString() },
    }));
  }, []);

  const viewedCount = Object.values(activity).filter(a => a.viewedAt).length;
  const downloadedCount = Object.values(activity).filter(
    a => a.downloadedAt
  ).length;

  return { activity, markViewed, markDownloaded, viewedCount, downloadedCount };
}
