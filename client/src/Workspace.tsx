import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  Download,
  Lock,
  LockOpen,
  Menu,
  Search,
  X,
} from "lucide-react";
import type { Module, VaultDocument } from "./App";
import { useVaultAccess } from "./hooks/useVaultAccess";
import { useVaultTracker } from "./hooks/useVaultTracker";
import {
  VaultDocumentCard,
  VaultPreviewModal,
  SitePinGate,
} from "./components/VaultParts";

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
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
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
  const access = useVaultAccess();
  const tracker = useVaultTracker();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [savedBrief, setSavedBrief] = useState(readBrief);
  const [note, setNote] = useState(savedBrief?.note ?? "");
  const [briefRoomId, setBriefRoomId] = useState(savedBrief?.roomId ?? modules[0]?.id);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState(modules[0]?.id ?? "");
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [vaultQuery, setVaultQuery] = useState("");
  const [vaultRoom, setVaultRoom] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [modules]);

  function scrollToId(id: string) {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openVaultRoom(room: string) {
    setVaultRoom(room);
    setVaultQuery("");
    requestAnimationFrame(() => scrollToId("vault"));
  }

  function handlePreview(doc: VaultDocument) {
    if (access.authorized === false) return;
    tracker.markViewed(doc.id);
    setPreviewDoc(doc);
  }

  function openBrief(useCurrentRoom = false) {
    if (useCurrentRoom || !savedBrief) setBriefRoomId(activeSection);
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
      setError("This browser could not save the brief. Export a copy to keep your work.");
    }
  }
  function exportBrief() {
    const briefRoom = modules.find(room => room.id === briefRoomId);
    const content = `# Project brief for Georgie\n\nWorkstream: ${briefRoom?.title ?? ""}\n\n## Question for the team\n\n${note.trim()}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `georgie-brief-${briefRoomId}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const openDecisions = decisions.filter(decision => decision.status === "open");
  const contentModules = modules.filter(m => m.id !== "vault" && m.id !== "decisions");
  const roomOptions = ["all", ...Array.from(new Set(documents.map(doc => doc.room)))];
  const filteredDocs = documents.filter(doc => {
    const matchesRoom = vaultRoom === "all" || doc.room === vaultRoom;
    const matchesQuery = `${doc.name} ${doc.room} ${doc.type}`
      .toLowerCase()
      .includes(vaultQuery.trim().toLowerCase());
    return matchesRoom && matchesQuery;
  });
  const decisionsFiltered = decisions.filter(
    decision => decisionFilter === "all" || decision.status === decisionFilter
  );
  const navItems = [...contentModules, { id: "vault", title: "Data vault" }, { id: "decisions", title: "Decisions" }];

  if (access.authorized !== true) {
    return (
      <div className="site">
        {access.authorized === false && <SitePinGate access={access} />}
      </div>
    );
  }

  return (
    <div className="site">
      <a className="skip-link" href="#hero">
        Skip to content
      </a>
      <header className="site-header">
        <button className="brand-lockup" onClick={() => scrollToId("hero")}>
          <span className="brand-mark">GB</span>
          <div>
            <strong>Peptide Bible</strong>
            <span>for Georgie</span>
          </div>
        </button>
        <nav className="site-nav desktop-nav" aria-label="Sections">
          {navItems.map(item => (
            <button
              key={item.id}
              className={activeSection === item.id ? "is-active" : ""}
              onClick={() => scrollToId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="vault-pill" onClick={() => scrollToId("vault")}>
            {access.authorized ? <LockOpen size={15} /> : <Lock size={15} />}
            Vault
          </button>
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <main>
        <section id="hero" className="hero" ref={el => { sectionRefs.current.hero = el; }}>
          <span className="eyebrow">Product · market · proof</span>
          <h1>Everything for the peptide venture, in one page.</h1>
          <p>
            Strategy, evidence, and next decisions for Georgie — scroll through every workstream, then
            open the vault for the source files behind each one.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => scrollToId(contentModules[0]?.id ?? "vault")}>
              Start with the business plan <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => scrollToId("vault")}>
              Open the vault
            </button>
          </div>
          <div className="attention-strip">
            <button onClick={() => scrollToId("decisions")}>
              <span className="eyebrow">Needs your input</span>
              <strong>
                {openDecisions.length} open decisions <ArrowRight size={16} />
              </strong>
              <span>{openDecisions[0]?.question}</span>
            </button>
            <button onClick={() => scrollToId("vault")}>
              <span className="eyebrow">Available evidence</span>
              <strong>
                {documents.length} source documents <ArrowRight size={16} />
              </strong>
              <span>Research, budgets, brand directions, and operating guides.</span>
            </button>
          </div>
        </section>

        {contentModules.map((module, index) => {
          const Icon = module.icon;
          const roomDocs = documents.filter(doc => doc.room === module.title);
          return (
            <motion.section
              id={module.id}
              key={module.id}
              ref={el => { sectionRefs.current[module.id] = el; }}
              className={`workstream-section accent-${module.accent} ${index % 2 === 1 ? "is-alt" : ""}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span className="workstream-watermark" aria-hidden="true">
                {module.section}
              </span>
              <div className="workstream-top">
                <div className="workstream-heading">
                  <span className="eyebrow">
                    {module.section} · {module.status}
                  </span>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                </div>
                <motion.div
                  className="workstream-badge"
                  initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                >
                  <Icon size={34} />
                </motion.div>
              </div>

              <div className="workstream-content">
                {module.content.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <motion.ul
                className="workstream-outline"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10% 0px" }}
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {module.bullets.map(bullet => (
                  <motion.li
                    key={bullet}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    {bullet}
                  </motion.li>
                ))}
              </motion.ul>

              <div className="workstream-footer">
                {roomDocs.length > 0 ? (
                  <div className="workstream-files">
                    <div className="workstream-files-head">
                      <span>
                        {roomDocs.length} source {roomDocs.length === 1 ? "file" : "files"} for{" "}
                        {module.title.toLowerCase()}
                      </span>
                      <button className="text-link" onClick={() => openVaultRoom(module.title)}>
                        View all in vault <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="mini-doc-grid">
                      {roomDocs.slice(0, 3).map(doc => (
                        <button key={doc.id} className="mini-doc" onClick={() => openVaultRoom(module.title)}>
                          <strong>{doc.name}</strong>
                          <span>
                            {doc.type} · {doc.size}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-primary workstream-download" onClick={() => openVaultRoom(module.title)}>
                      <Download size={15} /> Download the {module.title.toLowerCase()} files
                    </button>
                  </div>
                ) : (
                  <button className="text-link" onClick={() => scrollToId("vault")}>
                    Open the vault <ArrowRight size={15} />
                  </button>
                )}
                <button className="text-link" onClick={() => openBrief(true)}>
                  Add a question about this workstream <ArrowRight size={15} />
                </button>
              </div>
            </motion.section>
          );
        })}

        <section id="vault" ref={el => { sectionRefs.current.vault = el; }} className="vault-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">Data vault</span>
              <h2>Every source file, in one place.</h2>
              <p>Preview or download the original files behind each workstream.</p>
            </div>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search documents"
                placeholder="Search documents"
                value={vaultQuery}
                onChange={event => setVaultQuery(event.target.value)}
              />
              {vaultQuery && (
                <button onClick={() => setVaultQuery("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </label>
          </div>
          <div className="room-filter" role="tablist" aria-label="Filter by workstream">
            {roomOptions.map(room => (
              <button
                key={room}
                className={vaultRoom === room ? "is-active" : ""}
                aria-pressed={vaultRoom === room}
                onClick={() => setVaultRoom(room)}
              >
                {room === "all" ? "All rooms" : room}
              </button>
            ))}
          </div>
          <div className="vault-grid">
            {filteredDocs.map(doc => (
              <VaultDocumentCard
                key={doc.id}
                doc={doc}
                authorized={access.authorized}
                tracker={tracker}
                onPreview={handlePreview}
              />
            ))}
          </div>
          {filteredDocs.length === 0 && (
            <p className="empty-state" role="status">
              No documents match “{vaultQuery}”.
            </p>
          )}
          <p className="vault-tracker-summary">
            {tracker.viewedCount} previewed · {tracker.downloadedCount} downloaded on this device
          </p>
        </section>

        <section id="decisions" ref={el => { sectionRefs.current.decisions = el; }} className="decisions-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">Questions &amp; decisions</span>
              <h2>What still needs an answer.</h2>
            </div>
            <div className="decision-filter" aria-label="Filter decisions">
              {["all", "open", "resolved"].map(value => (
                <button
                  key={value}
                  className={decisionFilter === value ? "is-active" : ""}
                  aria-pressed={decisionFilter === value}
                  onClick={() => setDecisionFilter(value)}
                >
                  {value} ({decisions.filter(d => value === "all" || d.status === value).length})
                </button>
              ))}
            </div>
          </div>
          <div className="decision-list">
            {decisionsFiltered.map(decision => (
              <div className={`decision-row ${decision.status}`} key={decision.id}>
                <span className="decision-status">{decision.status}</span>
                <div>
                  <strong>{decision.question}</strong>
                  <span>Owner: {decision.owner}</span>
                </div>
                <b>{decision.priority}</b>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Peptide Bible / Georgie</span>
        <button className="text-link" onClick={() => openBrief()}>
          <ClipboardCheck size={16} /> Project brief <span>{savedBrief ? "saved" : "draft"}</span>
        </button>
      </footer>

      {mobileOpen && (
        <Modal title="Sections" className="navigation-dialog" onClose={() => setMobileOpen(false)}>
          <nav className="module-nav">
            {navItems.map(item => (
              <button key={item.id} onClick={() => scrollToId(item.id)}>
                {item.title}
              </button>
            ))}
          </nav>
        </Modal>
      )}

      {briefOpen && (
        <Modal title="Project brief for Georgie" onClose={() => setBriefOpen(false)}>
          <p className="modal-intro">
            Save your working brief on this device, or export a copy to share with your team.
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
                rows={5}
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder="Capture the question, constraint, or decision that needs an answer."
              />
            </label>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={!note.trim()}>
                Save on this device
              </button>
              <button type="button" className="btn btn-ghost" onClick={exportBrief} disabled={!note.trim()}>
                Export as file
              </button>
            </div>
            {notice && (
              <p className="modal-notice" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}

      {previewDoc && (
        <VaultPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => tracker.markDownloaded(previewDoc.id)}
        />
      )}
    </div>
  );
}
