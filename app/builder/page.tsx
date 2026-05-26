"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Device = "desktop" | "tablet" | "mobile";

type GeneratedPage = {
  name: string;
  slug: string;
  html: string;
};

export default function BuilderPage() {
  const [idea, setIdea] = useState("");
  const [html, setHtml] = useState("");
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [activePage, setActivePage] = useState(0);

  const [name, setName] = useState("Generated Site");
  const [slug, setSlug] = useState("generated-site");
  const [device, setDevice] = useState<Device>("desktop");
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [editText, setEditText] = useState("");
  const [showPublish, setShowPublish] = useState(false);

  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");
  const [deployUrl, setDeployUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ideaFromUrl = params.get("idea") || "Build a useful startup web app";
    const decoded = decodeURIComponent(ideaFromUrl);

    setIdea(decoded);
    generate(decoded);
  }, []);

  async function generate(promptIdea: string) {
    setLoading(true);
    setError("");
    setHtml("");
    setPages([]);
    setActivePage(0);
    setSteps([]);
    setDeployUrl("");

    setTimeout(() => setSteps(["Analyzing idea..."]), 250);
    setTimeout(() => setSteps((p) => [...p, "Writing multi-page app code..."]), 900);
    setTimeout(() => setSteps((p) => [...p, "Creating pages and navigation..."]), 1600);
    setTimeout(() => setSteps((p) => [...p, "Preparing live preview..."]), 2300);

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

      await fetch("/api/save-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name || "Generated Site",
          slug: data.slug || "generated-site",
          html: firstHtml,
          pages: nextPages,
          idea: promptIdea,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function sendEdit() {
    if (!editText.trim() || !html) return;

    setLoading(true);
    setError("");
    setSteps([
      "Reading current page...",
      "Applying your edit...",
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
          instruction: editText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to edit project");
      }

      const updatedHtml = data.html;

      const updatedPages = pages.map((page, index) =>
        index === activePage
          ? {
              ...page,
              html: updatedHtml,
            }
          : page
      );

      setHtml(updatedHtml);
      setEditText("");
      setPages(updatedPages);

      await fetch("/api/save-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          html: activePage === 0 ? updatedHtml : pages[0]?.html || updatedHtml,
          pages: updatedPages.length ? updatedPages : pages,
          idea,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function publishSite() {
    try {
      setShowPublish(true);
      setDeploying(true);
      setDeployUrl("");

      setDeployStep("Uploading files...");
      await new Promise((r) => setTimeout(r, 700));

      setDeployStep("Building project...");
      await new Promise((r) => setTimeout(r, 1200));

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
    <div style={s.app}>
      <aside style={s.sidebar}>
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
          <div style={s.userBubble}>{idea}</div>

          <div style={s.resultCard}>
            <b>{loading ? "Generating with AI..." : "Website generated"}</b>

            <p style={s.muted}>
              {loading
                ? "The AI is writing a multi-page app from your prompt."
                : `Created: ${name}`}
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
                    {page.name}
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
        <header style={s.topbar}>
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
            <button style={s.actionBtn}>Review</button>

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
                <p>This can take a few seconds.</p>
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
  sidebar: {
    width: 380,
    minWidth: 380,
    background: "#080808",
    borderRight: "1px solid rgba(255,255,255,.09)",
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
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pageBtn: {
    height: 36,
    padding: "0 13px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    color: "rgba(255,255,255,.68)",
    cursor: "pointer",
    fontWeight: 700,
  },
  pageActive: {
    height: 36,
    padding: "0 13px",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,.6)",
    background: "rgba(124,58,237,.24)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
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
  actions: { display: "flex", gap: 9 },
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
  },
  modal: {
    width: 560,
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