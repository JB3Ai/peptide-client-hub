import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Download, Eye, Lock, X } from "lucide-react";
import type { VaultDocument } from "../App";
import { useVaultAccess } from "../hooks/useVaultAccess";
import type { useVaultTracker } from "../hooks/useVaultTracker";

const OFFICE_EXTENSIONS = new Set(["docx", "xlsx", "pptx"]);
const TEXT_EXTENSIONS = new Set(["md", "csv", "txt"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);

function extensionOf(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setText(null);
    setFailed(false);
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("fetch failed");
        return response.text();
      })
      .then(value => {
        if (!cancelled) setText(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (failed) return <p className="preview-fallback">Could not load a text preview. Download the file instead.</p>;
  if (text === null) return <p className="preview-fallback">Loading preview…</p>;
  return <pre className="preview-text">{text}</pre>;
}

/**
 * Renders the right preview UI for a vault document based on file extension.
 * Office documents (docx/xlsx/pptx) use the Microsoft Office Online viewer,
 * which only works against a publicly reachable HTTPS URL — so it falls back
 * to a friendly message when running on localhost.
 */
function PreviewBody({ doc }: { doc: VaultDocument }) {
  const ext = extensionOf(doc.filename);
  const absoluteUrl =
    typeof window !== "undefined" ? `${window.location.origin}${doc.url}` : doc.url;
  const isLocalHost =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);

  if (ext === "pdf") {
    return <iframe className="preview-frame" src={doc.url} title={doc.name} />;
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return <img className="preview-image" src={doc.url} alt={doc.name} />;
  }
  if (ext === "m4a" || ext === "mp3" || ext === "wav") {
    return (
      <div className="preview-audio">
        <audio controls src={doc.url} />
      </div>
    );
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    return <TextPreview url={doc.url} />;
  }
  if (OFFICE_EXTENSIONS.has(ext)) {
    if (isLocalHost) {
      return (
        <p className="preview-fallback">
          Office previews need a public URL, so they aren’t available on localhost.
          Download the file to view it, or preview it once the site is deployed.
        </p>
      );
    }
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`;
    return <iframe className="preview-frame" src={viewerUrl} title={doc.name} />;
  }
  return (
    <p className="preview-fallback">
      No inline preview is available for this file type. Download it to view the contents.
    </p>
  );
}

export function VaultPreviewModal({
  doc,
  onClose,
  onDownload,
}: {
  doc: VaultDocument;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="preview-overlay" role="dialog" aria-modal aria-label={doc.name}>
      <div className="preview-panel">
        <div className="preview-head">
          <div>
            <strong>{doc.name}</strong>
            <span>
              {doc.type} · {doc.room} · {doc.size}
            </span>
          </div>
          <div className="preview-head-actions">
            <a className="btn btn-ghost" href={doc.url} download={doc.filename} onClick={onDownload}>
              <Download size={16} /> Download
            </a>
            <button className="modal-close" onClick={onClose} aria-label="Close preview">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="preview-body">
          <PreviewBody doc={doc} />
        </div>
      </div>
    </div>
  );
}

/** Small inline PIN form shown when the vault is locked. */
export function VaultPinGate({
  access,
  onUnlocked,
}: {
  access: ReturnType<typeof useVaultAccess>;
  onUnlocked?: () => void;
}) {
  const [pin, setPin] = useState("");
  return (
    <div className="pin-gate">
      <div className="pin-gate-icon">
        <Lock size={22} />
      </div>
      <div>
        <strong>Vault locked</strong>
        <p>Enter the PIN Georgie’s team was given to preview or download files.</p>
        {!access.configured && (
          <p className="pin-gate-error" role="alert">
            No vault PIN is configured on this deployment yet — set VAULT_PORTAL_PIN and
            VAULT_PIN_SECRET.
          </p>
        )}
      </div>
      <form
        onSubmit={async event => {
          event.preventDefault();
          const ok = await access.unlock(pin);
          if (ok) {
            setPin("");
            onUnlocked?.();
          }
        }}
      >
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin}
          onChange={event => setPin(event.target.value)}
          aria-label="Vault PIN"
        />
        <button className="btn btn-primary" type="submit" disabled={access.pending || !pin}>
          {access.pending ? "Checking…" : "Unlock"}
        </button>
      </form>
      {access.error && (
        <p className="pin-gate-error" role="alert">
          {access.error}
        </p>
      )}
    </div>
  );
}

export function VaultDocumentCard({
  doc,
  authorized,
  tracker,
  onPreview,
}: {
  doc: VaultDocument;
  authorized: boolean | null;
  tracker: ReturnType<typeof useVaultTracker>;
  onPreview: (doc: VaultDocument) => void;
}) {
  const status = tracker.activity[doc.id];
  const locked = authorized === false;
  return (
    <motion.div
      className={`vault-card ${locked ? "is-locked" : ""}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="vault-card-head">
        <span className="vault-card-type">{doc.type}</span>
        {status?.downloadedAt ? (
          <span className="vault-badge is-downloaded">Downloaded</span>
        ) : status?.viewedAt ? (
          <span className="vault-badge is-viewed">Viewed</span>
        ) : null}
      </div>
      <strong className="vault-card-title">{doc.name}</strong>
      <span className="vault-card-meta">
        {doc.room} · {doc.size}
      </span>
      <div className="vault-card-actions">
        <button
          className="btn btn-ghost"
          onClick={() => onPreview(doc)}
          disabled={locked}
        >
          <Eye size={15} /> Preview
        </button>
        <a
          className="btn btn-primary"
          href={locked ? undefined : doc.url}
          aria-disabled={locked}
          download={doc.filename}
          onClick={event => {
            if (locked) {
              event.preventDefault();
              return;
            }
            tracker.markDownloaded(doc.id);
          }}
        >
          <Download size={15} /> Download
        </a>
      </div>
    </motion.div>
  );
}

export const AnimateModal = AnimatePresence;
