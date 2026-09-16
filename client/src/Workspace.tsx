import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Database,
  Download,
  Menu,
  Search,
  X,
} from "lucide-react";
import type { Module, VaultDocument } from "./App";

const decisions = [
  {
    id: "q1",
    question: "Which supplier evidence must be closed before the first RFI?",
    owner: "Georgie + procurement",
    status: "open",
    priority: "High",
  },
  {
    id: "q2",
    question: "Which identity territory should lead packaging and the website?",
    owner: "Georgie + brand",
    status: "open",
    priority: "Medium",
  },
  {
    id: "q3",
    question: "What is the launch envelope for the pilot scenario?",
    owner: "Georgie + finance",
    status: "resolved",
    priority: "Resolved",
  },
];
type Brief = { note: string; roomId: string; savedAt: string };
const briefKey = "georgie-bible-brief-v1";
function readBrief(): Brief | null {
  try {
    const value = JSON.parse(localStorage.getItem(briefKey) ?? "null");
    return value &&
      typeof value.note === "string" &&
      typeof value.roomId === "string" &&
      typeof value.savedAt === "string"
      ? value
      : null;
  } catch {
    return null;
  }
}

function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`workspace-dialog ${className}`}
      aria-label={title}
      onCancel={onClose}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function Workspace({
  modules,
  documents,
}: {
  modules: Module[];
  documents: VaultDocument[];
}) {
  const [activeId, setActiveId] = useState("business");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [savedBrief, setSavedBrief] = useState(readBrief);
  const [note, setNote] = useState(savedBrief?.note ?? "");
  const [briefRoomId, setBriefRoomId] = useState(
    savedBrief?.roomId ?? "business"
  );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const roomRef = useRef<HTMLElement>(null);
  const active = modules.find(room => room.id === activeId) ?? modules[0];
  const openDecisions = decisions.filter(
    decision => decision.status === "open"
  );
  const availableFiles = documents.filter(doc => doc.url).length;
  const fileStatus = `${availableFiles} ${availableFiles === 1 ? "file" : "files"} available`;
  const status = (room: Module) =>
    room.id === "decisions"
      ? `${openDecisions.length} open`
      : room.id === "vault"
        ? fileStatus
        : room.status;
  const filtered = modules.filter(room =>
    `${room.title} ${room.description} ${room.bullets.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  const briefRoom = modules.find(room => room.id === briefRoomId) ?? active;

  useEffect(() => {
    const viewport = window.matchMedia("(min-width: 781px)");
    const closeOnDesktop = () => {
      if (viewport.matches) setMobileOpen(false);
    };
    viewport.addEventListener("change", closeOnDesktop);
    return () => viewport.removeEventListener("change", closeOnDesktop);
  }, []);

  function openRoom(id: string) {
    setActiveId(id);
    setMobileOpen(false);
    requestAnimationFrame(() => {
      roomRef.current?.focus({ preventScroll: true });
      roomRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }
  function openBrief(useCurrentRoom = false) {
    if (useCurrentRoom || !savedBrief) setBriefRoomId(activeId);
    setNotice("");
    setError("");
    setBriefOpen(true);
  }
  function saveBrief() {
    const value = {
      note: note.trim(),
      roomId: briefRoomId,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(briefKey, JSON.stringify(value));
      setSavedBrief(value);
      setNotice("Saved on this device. You can reopen or export this brief.");
      setError("");
    } catch {
      setNotice("");
      setError(
        "This browser could not save the brief. Export a copy to keep your work."
      );
    }
  }
  function exportBrief() {
    const content = `# Project brief for Georgie\n\nWorkstream: ${briefRoom.title}\nStatus: ${status(briefRoom)}\n\n## Question for the team\n\n${note.trim()}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `georgie-brief-${briefRoom.id}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const navigation = (
    <nav className="module-nav" aria-label="Workstreams">
      {modules.map(room => {
        const Icon = room.icon;
        return (
          <button
            key={room.id}
            className={`module-link ${activeId === room.id ? "is-active" : ""}`}
            aria-current={activeId === room.id ? "page" : undefined}
            onClick={() => openRoom(room.id)}
          >
            <span className="module-number">{room.section}</span>
            <Icon size={17} />
            <span>{room.title}</span>
            {activeId === room.id && <ArrowRight size={14} />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="hub-shell">
      <a className="skip-link" href="#selected-room">
        Skip to workstream
      </a>
      <aside className="hub-sidebar desktop-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">GB</div>
          <div>
            <strong>PEPTIDE</strong>
            <strong>BIBLE</strong>
            <span>for Georgie</span>
          </div>
        </div>
        <div className="sidebar-intro">
          <span className="eyebrow">Your working library</span>
          <p>From evidence to the next decision.</p>
        </div>
        {navigation}
        <button className="vault-callout" onClick={() => openRoom("vault")}>
          <Database size={18} />
          <div>
            <strong>Data vault</strong>
            <span>{fileStatus}</span>
          </div>
        </button>
        <div className="sidebar-footer">Georgie workspace</div>
      </aside>
      <div className="hub-main">
        <header className="hub-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} />
          </button>
          <div className="crumb">
            <span>GEORGIE</span>
            <strong>Peptide Bible</strong>
          </div>
          <button className="brief-button" onClick={() => openBrief()}>
            <ClipboardCheck size={17} /> Project brief{" "}
            <span>{savedBrief ? "saved" : "draft"}</span>
          </button>
        </header>
        <main>
          <section className="workspace-welcome">
            <span className="eyebrow">Product / market / proof</span>
            <h1>A clearer path to launch.</h1>
            <p>Your evidence, workstreams, and next decisions in one place.</p>
          </section>
          <section
            className="attention-strip"
            aria-label="Workspace priorities"
          >
            <button onClick={() => openRoom("decisions")}>
              <span className="eyebrow">Needs your input</span>
              <strong>
                {openDecisions.length} open decisions <ArrowRight size={17} />
              </strong>
              <span>{openDecisions[0]?.question}</span>
            </button>
            <button onClick={() => openRoom("vault")}>
              <span className="eyebrow">Available evidence</span>
              <strong>
                {documents.length} source documents <ArrowRight size={17} />
              </strong>
              <span>
                Research, budgets, brand directions, and operating guides.
              </span>
            </button>
          </section>
          <section
            id="selected-room"
            className="selected-workstream"
            ref={roomRef}
            tabIndex={-1}
            aria-label={`${active.title} workstream`}
          >
            <div className="workstream-heading">
              <div>
                <span className="eyebrow">
                  {active.section} / selected workstream
                </span>
                <h2>{active.title}</h2>
              </div>
              <span className="workstream-status">{status(active)}</span>
            </div>
            <p className="workstream-description">{active.description}</p>
            {activeId === "vault" ? (
              <div className="document-table">
                <p className="section-note">
                  Download the original source files. Each entry shows its
                  format, workstream, and file size.
                </p>
                {documents.map(doc => (
                  <div className="document-row" key={doc.id}>
                    <BookOpen size={20} />
                    <div>
                      <strong>{doc.name}</strong>
                      <span>
                        {doc.type} · {doc.room} · {doc.size}
                      </span>
                    </div>
                    {doc.url ? (
                      <a
                        className="document-action"
                        href={doc.url}
                        download={doc.filename}
                        aria-label={`Download ${doc.name} (${doc.type})`}
                      >
                        <Download size={16} /> Download {doc.type}
                      </a>
                    ) : (
                      <span className="file-unavailable">
                        Storage setup pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : activeId === "decisions" ? (
              <>
                <div className="decision-filter" aria-label="Filter decisions">
                  {["all", "open", "resolved"].map(value => (
                    <button
                      key={value}
                      className={filter === value ? "is-active" : ""}
                      aria-pressed={filter === value}
                      onClick={() => setFilter(value)}
                    >
                      {value} (
                      {
                        decisions.filter(
                          decision =>
                            value === "all" || decision.status === value
                        ).length
                      }
                      )
                    </button>
                  ))}
                </div>
                <div className="decision-list">
                  {decisions
                    .filter(
                      decision => filter === "all" || decision.status === filter
                    )
                    .map(decision => (
                      <div
                        className={`decision-row ${decision.status}`}
                        key={decision.id}
                      >
                        <span className="decision-status">
                          {decision.status}
                        </span>
                        <div>
                          <strong>{decision.question}</strong>
                          <span>Owner: {decision.owner}</span>
                        </div>
                        <b>{decision.priority}</b>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="workstream-body">
                <div>
                  <h3>Workstream outline</h3>
                  <ol className="workstream-outline">
                    {active.bullets.map(bullet => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ol>
                </div>
                <div className="working-note">
                  <span className="eyebrow">Move this forward</span>
                  <h3>What needs an answer next?</h3>
                  <p>
                    Capture the question, constraint, or decision that your team
                    should resolve for this workstream.
                  </p>
                  <button className="text-link" onClick={() => openBrief(true)}>
                    Add to project brief <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </section>
          <section
            className="workspace-section"
            aria-label="Workstream directory"
          >
            <div className="section-header">
              <div>
                <span className="eyebrow">{modules.length} workstreams</span>
                <h2>Explore the workspace.</h2>
              </div>
              <label className="search-field">
                <Search size={19} />
                <input
                  aria-label="Search workstreams"
                  placeholder="Search workstreams"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </label>
            </div>
            <div className="room-directory">
              {filtered.map(room => (
                <button
                  key={room.id}
                  className={`directory-row ${activeId === room.id ? "is-selected" : ""}`}
                  aria-pressed={activeId === room.id}
                  onClick={() => openRoom(room.id)}
                >
                  <span className="directory-number">{room.section}</span>
                  <span>
                    <strong>{room.title}</strong>
                    <span>{room.description}</span>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="empty-state" role="status">
                No workstreams match “{query}”. Try procurement, brand, finance,
                or research.
              </p>
            )}
          </section>
        </main>
        <footer className="hub-footer">
          <span>PEPTIDE BIBLE / GEORGIE</span>
          <span>Strategy · evidence · handoff</span>
        </footer>
      </div>
      {mobileOpen && (
        <Modal
          title="Workstreams"
          className="navigation-dialog"
          onClose={() => setMobileOpen(false)}
        >
          {navigation}
        </Modal>
      )}
      {briefOpen && (
        <Modal
          title="Project brief for Georgie"
          onClose={() => setBriefOpen(false)}
        >
          <p className="modal-intro">
            Save your working brief on this device, or export a copy to share
            with your team.
          </p>
          <form
            onSubmit={event => {
              event.preventDefault();
              saveBrief();
            }}
          >
            <label className="modal-label">
              Workstream
              <select
                value={briefRoomId}
                onChange={event => {
                  setBriefRoomId(event.target.value);
                  setNotice("");
                }}
              >
                {modules.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-label">
              What should the team resolve next?
              <textarea
                required
                rows={5}
                value={note}
                onChange={event => {
                  setNote(event.target.value);
                  setNotice("");
                  setError("");
                }}
                placeholder="Add a question, constraint, deadline, or decision."
              />
            </label>
            <div className="brief-actions">
              <button
                className="primary-button"
                disabled={!note.trim()}
                type="submit"
              >
                Save brief on this device
              </button>
              <button
                type="button"
                className="quiet-button"
                disabled={!note.trim()}
                onClick={exportBrief}
              >
                <Download size={18} /> Export brief
              </button>
            </div>
            {notice && (
              <p className="save-notice" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="save-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
