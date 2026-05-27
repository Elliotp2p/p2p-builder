"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Device = "desktop" | "tablet" | "mobile";

type GeneratedPage = {
  name: string;
  slug: string;
  html: string;
};

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

export default function BuilderPage() {
  const [idea, setIdea] = useState("");
  const [html, setHtml] = useState("");
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [activePage, setActivePage] = useState(0);

  const [name, setName] = useState("Generated Site");
  const [slug, setSlug] = useState("generated-site");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [device, setDevice] = useState<Device>("desktop");
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [editText, setEditText] = useState("");

  const [showPublish, setShowPublish] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");
  const [deployUrl, setDeployUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < 900);
    }

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    const ideaFromUrl = params.get("idea") || "Build a useful startup web app";

    if (projectId) {
      setCurrentProjectId(projectId);
      loadProject(projectId);
      return;
    }

    const decoded = decodeURIComponent(ideaFromUrl);
    setIdea(decoded);
    setChatMessages([{ role: "user", text: decoded }]);
    generate(decoded);
  }, []);

  async function loadProject(projectId: string) {
    setLoading(true);
    setError("");
    setSteps(["Opening saved project...", "Loading pages...", "Preparing workspace..."]);

    try {
      const res = await fetch(`/api/load-project?id=${projectId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load project");
      }

      const loadedPages: GeneratedPage[] = Array.isArray(data.pages)
        ? data.pages
        : [];

      setCurrentProjectId(data.id);
      setName(data.name || "Generated Site");
      setSlug(data.slug || "generated-site");
      setIdea(data.idea || "");
      setPages(loadedPages);
      setActivePage(0);
      setHtml(loadedPages[0]?.html || data.html || "");
      setChatMessages([
        { role: "user", text: data.idea || "Saved project" },
        { role: "ai", text: "Opened your saved project. Continue editing from here." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function generate(promptIdea: string) {
    setLoading(true);
    setError("");
    setHtml("");
    setPages([]);
    setActivePage(0);
    setSteps([]);
    setDeployUrl("");

    const generationSteps = [
  "Analyzing market opportunity...",
  "Understanding target audience...",
  "Choosing optimal SaaS layout...",
  "Designing premium UI system...",
  "Generating responsive navigation...",
  "Building landing experience...",
  "Creating dashboard components...",
  "Generating interactive sections...",
  "Optimizing typography and spacing...",
  "Creating mobile experience...",
  "Adding gradients and visual polish...",
  "Connecting multi-page structure...",
  "Generating conversion flow...",
  "Optimizing startup branding...",
  "Preparing live preview...",
];

    generationSteps.forEach((step, index) => {
      setTimeout(() => {
        setSteps((current) => [...current, step]);
      }, 350 + index * 320);
    });

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: promptIdea,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate site");
      }

      const nextPages: GeneratedPage[] = Array.isArray(data.pages)
        ? data.pages
        : [];

      const firstHtml = nextPages[0]?.html || data.html || "";

      setPages(nextPages);
      setActivePage(0);
      setHtml(firstHtml);
      setName(data.name || "Generated Site");
      setSlug(data.slug || "generated-site");

      const endpoint = currentProjectId
        ? "/api/update-project"
        : "/api/save-project";

      setIsSaving(true);

      const saveRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentProjectId,
          name: data.name || "Generated Site",
          slug: data.slug || "generated-site",
          html: firstHtml,
          pages: nextPages,
          idea: promptIdea,
        }),
      });

      const saveData = await saveRes.json().catch(() => null);

      if (!currentProjectId && saveData?.project?.id) {
        setCurrentProjectId(saveData.project.id);
      }

      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());

      setChatMessages((current) => [
        ...current,
        { role: "ai", text: "Generated a multi-page website with live preview." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  }

  async function sendEdit() {
    if (!editText.trim() || !html) return;

    const instruction = editText.trim();

    setChatMessages((current) => [
      ...current,
      { role: "user", text: instruction },
    ]);

    setLoading(true);
    setError("");
    setSteps([
      "Reading current page...",
      "Understanding edit request...",
      "Applying targeted changes...",
      "Updating live preview...",
    ]);

    try {
      const res = await fetch("/api/edit-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          instruction,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to edit project");
      }

      const updatedHtml = data.html;

      const updatedPages = pages.length
        ? pages.map((page, index) =>
            index === activePage
              ? {
                  ...page,
                  html: updatedHtml,
                }
              : page
          )
        : [];

      setHtml(updatedHtml);
      setEditText("");
      setPages(updatedPages);

      await saveProject(updatedHtml, updatedPages);

      setChatMessages((current) => [
        ...current,
        { role: "ai", text: "Edited the current page and saved your changes." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveProject(
    nextHtml = html,
    nextPages: GeneratedPage[] = pages
  ) {
    if (!nextHtml) return;

    const endpoint = currentProjectId
      ? "/api/update-project"
      : "/api/save-project";

    setIsSaving(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentProjectId,
          name,
          slug,
          html: nextPages[0]?.html || nextHtml,
          pages: nextPages,
          idea,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!currentProjectId && data?.project?.id) {
        setCurrentProjectId(data.project.id);
      }

      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!html || !currentProjectId || loading) return;

    const timeout = setTimeout(() => {
      saveProject();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [html]);

  async function publishSite() {
    try {
      setShowPublish(true);
      setDeploying(true);
      setDeployUrl("");

      setDeployStep("Uploading files...");
      await new Promise((r) => setTimeout(r, 700));

      setDeployStep("Building project...");
      await new Promise((r) => setTimeout(r, 1000));

      setDeployStep("Deploying to Vercel...");

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          html,
          pages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Deploy failed");
      }

      setDeployStep("Deployment complete!");
      setDeployUrl(data.url);
      window.open(data.url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  const previewWidth =
    device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";

  return (
    <div style={isNarrow ? s.appMobile : s.app}>
      <aside style={isNarrow ? s.sidebarMobile : s.sidebar}>
        <div style={s.brand}>
          <div style={s.logo}>P</div>

          <div>
            <div style={s.brandTitle}>Problem to Profit</div>
            <div style={s.brandSub}>AI Website Builder</div>
          </div>
        </div>

        <div style={s.tabs}>
          <button style={s.tabActive}>Chat</button>
          <button style={s.tab}>Files</button>
          <button style={s.tab}>History</button>
        </div>

        <div style={s.chat}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              style={msg.role === "user" ? s.userBubble : s.aiBubble}
            >
              {msg.text}
            </div>
          ))}

          <div style={s.resultCard}>
            <b>{loading ? "Working with AI..." : "Workspace ready"}</b>

            <p style={s.muted}>
              {loading
                ? "The AI is processing your product and updating the preview."
                : `Project: ${name}`}
            </p>
          </div>

          {steps.map((step, i) => (
            <div key={i} style={s.step}>
              <span style={s.dot}></span>
              {step}
            </div>
          ))}

          {!loading && pages.length > 0 && (
            <div style={s.pagePanel}>
              <b>Generated pages</b>

              <div style={s.pageList}>
                {pages.map((page, index) => (
                  <button
                    key={`${page.slug}-${index}`}
                    onClick={() => {
                      setActivePage(index);
                      setHtml(page.html);
                    }}
                    style={activePage === index ? s.pageActive : s.pageBtn}
                  >
                    <span>{page.name}</span>
                    <small style={s.pageSlug}>/{page.slug}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={s.errorBox}>
              <b>Error</b>
              <p>{error}</p>
            </div>
          )}
        </div>

        <div style={s.inputBox}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Ask AI to edit this page..."
            style={s.textarea}
          />

          <button onClick={sendEdit} style={s.sendBtn}>
            Send edit
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={isNarrow ? s.topbarMobile : s.topbar}>
          <div style={s.deviceGroup}>
            {(["desktop", "tablet", "mobile"] as const).map((x) => (
              <button
                key={x}
                onClick={() => setDevice(x)}
                style={device === x ? s.deviceActive : s.device}
              >
                {x[0].toUpperCase() + x.slice(1)}
              </button>
            ))}
          </div>

          <div style={s.url}>
            https://problemtoprofit.dev/site/{slug}
            {pages[activePage]?.slug && pages[activePage]?.slug !== "index"
              ? `/${pages[activePage].slug}`
              : ""}
          </div>

          <div style={s.actions}>
            <button onClick={() => generate(idea)} style={s.actionBtn}>
              Regen
            </button>

            <button
              onClick={() => {
                window.location.href = "/projects";
              }}
              style={s.actionBtn}
            >
              Projects
            </button>

            <div style={s.saveStatus}>
              <div
                style={{
                  ...s.saveDot,
                  background: isSaving ? "#f59e0b" : "#22c55e",
                }}
              />

              <span>
                {isSaving
                  ? "Saving..."
                  : lastSaved
                  ? `Saved ${lastSaved}`
                  : "Ready"}
              </span>
            </div>

            <button onClick={() => setShowPublish(true)} style={s.publish}>
              Publish
            </button>
          </div>
        </header>

        {!loading && pages.length > 0 && (
          <nav style={s.pageTabsTop}>
            {pages.map((page, index) => (
              <button
                key={`${page.slug}-top-${index}`}
                onClick={() => {
                  setActivePage(index);
                  setHtml(page.html);
                }}
                style={activePage === index ? s.topPageActive : s.topPageBtn}
              >
                {page.name}
              </button>
            ))}
          </nav>
        )}

        <section style={s.previewArea}>
          <div style={{ ...s.previewShell, width: previewWidth }}>
            {loading ? (
              <div style={s.generatingPreview}>
                <div style={s.loader}></div>
                <h1>AI is building your website...</h1>
                <p>{steps[steps.length - 1] || "Starting generation..."}</p>
              </div>
            ) : error ? (
              <div style={s.generatingPreview}>
                <h1>Something went wrong</h1>
                <p>{error}</p>
              </div>
            ) : (
              <iframe title="Website preview" srcDoc={html} style={s.iframe} />
            )}
          </div>
        </section>
      </main>

      {showPublish && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Publish website</h2>
                <p style={s.modalSub}>problemtoprofit.dev/site/{slug}</p>
              </div>

              <button onClick={() => setShowPublish(false)} style={s.closeBtn}>
                ✕
              </button>
            </div>

            {pages.length > 0 && (
              <div style={s.publishCard}>
                <b>Pages included</b>

                <p style={s.muted}>
                  {pages.map((page) => page.name).join(", ")}
                </p>
              </div>
            )}

            {deploying ? (
              <div style={s.deployBox}>
                <div style={s.deploySpinner} />
                <h3 style={{ marginBottom: 8 }}>Deploying project...</h3>
                <p style={{ color: "rgba(255,255,255,.6)" }}>{deployStep}</p>
              </div>
            ) : deployUrl ? (
              <div style={s.deploySuccess}>
                <h3>Website deployed!</h3>
                <p style={s.deployUrl}>{deployUrl}</p>

                <button
                  onClick={() => window.open(deployUrl, "_blank")}
                  style={s.bigPublish}
                >
                  Open website
                </button>
              </div>
            ) : (
              <button onClick={publishSite} style={s.bigPublish}>
                Publish website
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  app: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    overflow: "hidden",
    background: "#050505",
    color: "white",
    fontFamily: "Inter, Arial, sans-serif",
  },
  appMobile: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    background: "#050505",
    color: "white",
    fontFamily: "Inter, Arial, sans-serif",
  },
  sidebar: {
    width: 380,
    minWidth: 380,
    background: "#080808",
    borderRight: "1px solid rgba(255,255,255,.09)",
    display: "flex",
    flexDirection: "column",
  },
  sidebarMobile: {
    width: "100%",
    maxHeight: 460,
    background: "#080808",
    borderBottom: "1px solid rgba(255,255,255,.09)",
    display: "flex",
    flexDirection: "column",
  },
  brand: {
    height: 86,
    padding: "0 22px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    borderBottom: "1px solid rgba(255,255,255,.09)",
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 16,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  brandTitle: { fontSize: 17, fontWeight: 850 },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 3 },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    padding: 14,
    borderBottom: "1px solid rgba(255,255,255,.09)",
  },
  tabActive: {
    height: 40,
    border: 0,
    borderRadius: 15,
    background: "rgba(124,58,237,.45)",
    color: "white",
    fontWeight: 800,
  },
  tab: {
    height: 40,
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.035)",
    color: "rgba(255,255,255,.55)",
    fontWeight: 700,
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  userBubble: {
    marginLeft: 46,
    padding: 18,
    borderRadius: 24,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    lineHeight: 1.65,
    fontSize: 14,
  },
  aiBubble: {
    marginRight: 46,
    padding: 18,
    borderRadius: 24,
    background: "rgba(255,255,255,.055)",
    border: "1px solid rgba(255,255,255,.08)",
    lineHeight: 1.65,
    fontSize: 14,
    color: "rgba(255,255,255,.82)",
  },
  resultCard: {
    padding: 20,
    borderRadius: 24,
    background: "rgba(124,58,237,.09)",
    border: "1px solid rgba(124,58,237,.32)",
  },
  muted: {
    marginTop: 10,
    color: "rgba(255,255,255,.58)",
    fontSize: 14,
    lineHeight: 1.7,
  },
  step: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,.04)",
    color: "rgba(255,255,255,.72)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    background: "#a78bfa",
  },
  pagePanel: {
    padding: 18,
    borderRadius: 24,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
  },
  pageList: {
    display: "grid",
    gap: 8,
    marginTop: 12,
  },
  pageBtn: {
    minHeight: 42,
    padding: "10px 13px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    color: "rgba(255,255,255,.68)",
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageActive: {
    minHeight: 42,
    padding: "10px 13px",
    borderRadius: 14,
    border: "1px solid rgba(124,58,237,.6)",
    background: "rgba(124,58,237,.24)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageSlug: {
    color: "rgba(255,255,255,.38)",
    fontSize: 11,
  },
  errorBox: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(239,68,68,.12)",
    border: "1px solid rgba(239,68,68,.35)",
    color: "#fecaca",
  },
  inputBox: {
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,.09)",
  },
  textarea: {
    width: "100%",
    height: 96,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.045)",
    color: "white",
    padding: 16,
    outline: "none",
    resize: "none",
  },
  sendBtn: {
    width: "100%",
    height: 50,
    marginTop: 10,
    border: 0,
    borderRadius: 18,
    color: "white",
    fontWeight: 850,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    height: 86,
    borderBottom: "1px solid rgba(255,255,255,.09)",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px",
  },
  topbarMobile: {
    minHeight: 140,
    borderBottom: "1px solid rgba(255,255,255,.09)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  deviceGroup: {
    display: "flex",
    gap: 7,
    padding: 6,
    borderRadius: 18,
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.09)",
  },
  deviceActive: {
    height: 40,
    padding: "0 15px",
    border: 0,
    borderRadius: 13,
    background: "#7c3aed",
    color: "white",
    fontWeight: 850,
  },
  device: {
    height: 40,
    padding: "0 15px",
    border: 0,
    borderRadius: 13,
    background: "transparent",
    color: "rgba(255,255,255,.55)",
    fontWeight: 750,
    cursor: "pointer",
  },
  url: {
    flex: 1,
    minWidth: 220,
    height: 50,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    color: "rgba(255,255,255,.55)",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 9,
    alignItems: "center",
    flexWrap: "wrap",
  },
  actionBtn: {
    height: 44,
    padding: "0 15px",
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  saveStatus: {
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: 700,
  },
  saveDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  publish: {
    height: 44,
    padding: "0 24px",
    border: 0,
    borderRadius: 15,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  pageTabsTop: {
    height: 54,
    borderBottom: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflowX: "auto",
    padding: "0 14px",
  },
  topPageBtn: {
    height: 36,
    padding: "0 16px",
    borderRadius: 13,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.035)",
    color: "rgba(255,255,255,.62)",
    cursor: "pointer",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  topPageActive: {
    height: 36,
    padding: "0 16px",
    borderRadius: 13,
    border: "1px solid rgba(124,58,237,.55)",
    background: "rgba(124,58,237,.24)",
    color: "white",
    cursor: "pointer",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },
  previewArea: {
    flex: 1,
    padding: 18,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
  },
  previewShell: {
    height: "100%",
    maxWidth: "100%",
    borderRadius: 28,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.12)",
    background: "black",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: 0,
    background: "white",
  },
  generatingPreview: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at center,rgba(124,58,237,.24),#050505 60%)",
    textAlign: "center",
    padding: 40,
  },
  loader: {
    width: 54,
    height: 54,
    borderRadius: 999,
    border: "4px solid rgba(255,255,255,.15)",
    borderTopColor: "#a78bfa",
    marginBottom: 22,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
    padding: 18,
  },
  modal: {
    width: 560,
    maxWidth: "100%",
    borderRadius: 30,
    background: "#0b0b0b",
    border: "1px solid rgba(255,255,255,.12)",
    padding: 24,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 20,
  },
  modalTitle: { margin: 0, fontSize: 26 },
  modalSub: {
    marginTop: 7,
    color: "rgba(255,255,255,.55)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    color: "white",
    cursor: "pointer",
  },
  publishCard: {
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    marginBottom: 16,
  },
  deployBox: {
    padding: 24,
    borderRadius: 24,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    textAlign: "center",
  },
  deploySpinner: {
    width: 54,
    height: 54,
    borderRadius: 999,
    border: "4px solid rgba(255,255,255,.12)",
    borderTopColor: "#a78bfa",
    margin: "0 auto 20px",
  },
  deploySuccess: {
    padding: 24,
    borderRadius: 24,
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.35)",
    textAlign: "center",
  },
  deployUrl: {
    color: "rgba(255,255,255,.7)",
    marginTop: 10,
    wordBreak: "break-all",
  },
  bigPublish: {
    width: "100%",
    height: 56,
    marginTop: 22,
    border: 0,
    borderRadius: 18,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  },
};