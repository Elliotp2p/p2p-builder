"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useRef, useState } from "react";

const templates = [
  "SaaS Landing Page",
  "Mobile App",
  "Agency Website",
  "Marketplace",
  "AI Tool",
  "Local Business",
];

const styles = [
  "premium modern",
  "luxury dark",
  "minimal Apple style",
  "Stripe/Linear SaaS",
  "futuristic neon",
  "playful friendly",
];

const starters = [
  "AI receptionist för tandläkare",
  "App som planerar veckans mat",
  "Marketplace för lokala tränare",
  "AI lead finder för småföretag",
  "Smart städplanerare för hem",
];

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

type Project = {
  id: string;
  name: string;
  problem: string;
  template: string;
  created_at: string;
};

type Lead = {
  id: string;
  site_id: string;
  site_name?: string;
  name?: string;
  email?: string;
  message?: string;
  created_at?: string;
};

export default function BuilderPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [loginStatus, setLoginStatus] = useState("");

  const [problem, setProblem] = useState("");
  const [template, setTemplate] = useState(templates[0]);
  const [style, setStyle] = useState(styles[0]);
  const [audience, setAudience] = useState("kunder som vill spara tid");

  const [started, setStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState("index.html");
  const html = files[activeFile] || files["index.html"] || "";

  const [link, setLink] = useState("");
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Describe what you want to build and I’ll create the site.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previewOuterRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [scale, setScale] = useState(0.6);
  const [selectedText, setSelectedText] = useState("");

  const previewHtml = html
    ? html
        .replaceAll("/site/REPLACE_ID/pricing", "#")
        .replaceAll("/site/REPLACE_ID/about", "#")
        .replaceAll("/site/REPLACE_ID/contact", "#")
        .replaceAll("/site/REPLACE_ID", "#")
        .replace(
          "</head>",
          `<style>
            html, body {
              width: 1440px !important;
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: none !important;
              zoom: 1 !important;
            }

            body {
              display: block !important;
              overflow-x: hidden !important;
            }

            main, section, header, footer, nav {
              width: 100% !important;
            }

            a {
              pointer-events: auto !important;
            }

            h1:hover,
            h2:hover,
            h3:hover,
            h4:hover,
            h5:hover,
            h6:hover,
            p:hover,
            a:hover,
            button:hover,
            span:hover {
              outline: 2px solid #22c55e !important;
              outline-offset: 4px !important;
              cursor: pointer !important;
            }
          </style></head>`
        )
    : "";

  const fileTabs = [
    { label: "Home", file: "index.html" },
    { label: "Pricing", file: "pricing.html" },
    { label: "About", file: "about.html" },
    { label: "Contact", file: "contact.html" },
  ];

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUserEmail(session?.user?.email || "");
      setCheckingAuth(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !previewHtml) return;

    const injectEditor = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const elements = doc.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,a,button,span"
      );

      elements.forEach((el: any) => {
        el.style.cursor = "pointer";

        el.onclick = (e: any) => {
          e.preventDefault();
          e.stopPropagation();

          const text = el.innerText || "";
          if (!text.trim()) return;

          setSelectedText(text);

          const replacement = prompt("Edit text:", text);

          if (replacement && replacement !== text) {
            const updated = html.replace(text, replacement);

            setFiles((prev) => ({
              ...prev,
              [activeFile]: updated,
            }));

            setStatus("Text edited visually");
          }
        };
      });
    };

    const timeout = setTimeout(injectEditor, 600);
    return () => clearTimeout(timeout);
  }, [previewHtml, activeFile, html]);

  useEffect(() => {
    const updateScale = () => {
      if (!previewOuterRef.current) return;
      const width = previewOuterRef.current.clientWidth - 40;
      setScale(Math.min(width / 1440, 1));
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const readStream = async (res: Response) => {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No stream reader");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const line = event.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;

        const payload = JSON.parse(line.replace("data: ", ""));

        if (payload.type === "status") {
          setStatus(payload.text);
          setMessages((m) => [...m, { role: "ai", text: payload.text }]);
        }

        if (payload.type === "files") {
          const incomingFiles = payload.files || {};

          setFiles((prev) => ({
            ...prev,
            ...incomingFiles,
          }));

          if (incomingFiles["index.html"]) {
            setActiveFile("index.html");
          }
        }

        if (payload.type === "error") {
          setStatus("Error");
          setMessages((m) => [
            ...m,
            {
              role: "ai",
              text: payload.text || "Something went wrong.",
            },
          ]);
        }

        if (payload.type === "done") {
          setStatus("Done");
        }
      }
    }
  };

  const login = async () => {
    setLoginStatus("Opening Google...");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/builder`,
      },
    });

    if (error) {
      setLoginStatus(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const loadProjects = async () => {
    const res = await fetch("/api/sites");
    const data = await res.json();
    setProjects(data.sites || []);
  };

  const loadLeads = async () => {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads || []);
  };

  useEffect(() => {
    if (userEmail) {
      loadProjects();
      loadLeads();
    }
  }, [userEmail]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    setStarted(true);

    fetch(`/api/site?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.site) {
          const loadedFiles = data.site.html_files || {
            "index.html": data.site.html,
          };

          setFiles(loadedFiles);
          setActiveFile("index.html");
          setProblem(data.site.problem || "");
          setTemplate(data.site.template || templates[0]);
          setStatus("Project loaded");
          setMessages([
            {
              role: "ai",
              text: "Project loaded. I can edit the full multi-page site with context.",
            },
          ]);
        }
      });
  }, []);

  const addUser = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  };

  const runBuild = async (customProblem?: string) => {
    const finalProblem = customProblem || problem || chatInput;

    if (!finalProblem.trim()) return;

    setStarted(true);
    setLoading(true);
    setLink("");
    setStatus("Starting...");
    addUser(finalProblem);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: finalProblem,
          template,
          style,
          audience,
        }),
      });

      setProblem(finalProblem);
      setChatInput("");

      await readStream(res);
      setStatus("Preview updated");
    } catch {
      setStatus("Error");
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Network error. Try again with a shorter prompt.",
        },
      ]);
    }

    setLoading(false);
  };

  const edit = async () => {
    if (!chatInput.trim()) return;

    const instruction = chatInput;
    setChatInput("");

    if (!html) {
      await runBuild(instruction);
      return;
    }

    setLoading(true);
    setStatus("Editing...");
    addUser(instruction);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editWebsite: true,
          currentHtml: html,
          instruction,
          problem,
          activeFile,
          allFiles: files,
        }),
      });

      await readStream(res);
      setStatus("Edited");
    } catch {
      setStatus("Error");
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Network error while editing.",
        },
      ]);
    }

    setLoading(false);
  };

  const publish = async () => {
    if (!files["index.html"]) {
      setStatus("Generate first");
      return;
    }

    setStatus("Publishing");

    const res = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: files["index.html"],
        files,
        name: problem,
        problem,
        template,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("Publish error");
      return;
    }

    const fullUrl = window.location.origin + data.url;

    setLink(fullUrl);
    setStatus("Published");

    loadProjects();
    loadLeads();
  };

  const openProject = (id: string) => {
    window.location.href = `/builder?id=${id}`;
  };

  if (checkingAuth) {
    return (
      <main style={startPage}>
        <div style={startCard}>
          <div style={mark}>P</div>
          <h1 style={startTitle}>Loading...</h1>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main style={startPage}>
        <div style={startCard}>
          <div style={mark}>P</div>

          <p style={eyebrow}>Problem to Profit AI</p>

          <h1 style={startTitle}>Log in to build</h1>

          <p style={startText}>
            Continue with Google to access your AI builder workspace.
          </p>

          <button onClick={login} style={startButton}>
            Continue with Google
          </button>

          <p style={mutedSmall}>{loginStatus}</p>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main style={startPage}>
        <div style={startCard}>
          <div style={mark}>P</div>

          <p style={eyebrow}>Problem to Profit AI</p>

          <h1 style={startTitle}>What should we build?</h1>

          <p style={startText}>
            Choose the setup first. Then enter the builder with a clean workspace.
          </p>

          <label style={label}>Problem / product idea</label>

          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Ex: AI receptionist för tandläkare"
            style={bigTextArea}
          />

          <div style={startGrid}>
            <div>
              <label style={label}>Template</label>

              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={field}
              >
                {templates.map((t) => (
                  <option key={t} value={t} style={{ color: "#000" }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Style</label>

              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={field}
              >
                {styles.map((s) => (
                  <option key={s} value={s} style={{ color: "#000" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={label}>Audience</label>

          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            style={field}
          />

          <button
            onClick={() => runBuild()}
            disabled={loading}
            style={startButton}
          >
            {loading ? "Building..." : "Start building"}
          </button>

          <div style={starterGrid}>
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setProblem(s);
                  runBuild(s);
                }}
                style={starterPill}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={app}>
      <header style={topbar}>
        <div style={brand}>
          <div style={markSmall}>P</div>

          <div>
            <strong>Problem to Profit</strong>

            <p style={mutedSmall}>
              {status} · {activeFile} · {Math.round(scale * 100)}% · {userEmail}
            </p>
          </div>
        </div>

        <div style={topActions}>
          {fileTabs.map((tab) => (
            <button
              key={tab.file}
              onClick={() => files[tab.file] && setActiveFile(tab.file)}
              disabled={!files[tab.file]}
              style={{
                ...tabBtn,
                background:
                  activeFile === tab.file ? "#fff" : "rgba(255,255,255,.05)",
                color: activeFile === tab.file ? "#09090b" : "#fff",
                opacity: files[tab.file] ? 1 : 0.35,
              }}
            >
              {tab.label}
            </button>
          ))}

          <button onClick={() => runBuild()} disabled={loading} style={ghost}>
            Regenerate
          </button>

          <button onClick={publish} disabled={loading} style={publishBtn}>
            Publish
          </button>

          <button onClick={() => setMenuOpen(!menuOpen)} style={dots}>
            ⋯
          </button>
        </div>

        {menuOpen && (
          <div style={menu}>
            <h3 style={{ marginTop: 0 }}>Project settings</h3>

            <label style={label}>Template</label>

            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={field}
            >
              {templates.map((t) => (
                <option key={t} value={t} style={{ color: "#000" }}>
                  {t}
                </option>
              ))}
            </select>

            <label style={label}>Problem</label>

            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              style={field}
            />

            <label style={label}>Style</label>

            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={field}
            />

            <label style={label}>Audience</label>

            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              style={field}
            />

            {link && (
              <div style={linkBox}>
                <p style={{ margin: 0, marginBottom: 8 }}>Live link</p>

                <a
                  href={link}
                  target="_blank"
                  style={{
                    color: "#86efac",
                    wordBreak: "break-all",
                  }}
                >
                  {link}
                </a>
              </div>
            )}

            <div style={projectsBox}>
              <div style={rowBetween}>
                <h3 style={{ margin: 0 }}>Projects</h3>

                <button onClick={loadProjects} style={refresh}>
                  Refresh
                </button>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {projects.length === 0 && (
                  <p style={mutedSmall}>No projects yet.</p>
                )}

                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p.id)}
                    style={projectCard}
                  >
                    <strong>{p.name || "Untitled project"}</strong>

                    <span style={mutedSmall}>{p.template}</span>

                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      Open in builder
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={leadsBox}>
              <div style={rowBetween}>
                <h3 style={{ margin: 0 }}>Leads inbox</h3>

                <button onClick={loadLeads} style={refresh}>
                  Refresh
                </button>
              </div>

              <p style={mutedSmall}>
                Messages collected from your published sites.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {leads.length === 0 && (
                  <p style={mutedSmall}>No leads yet.</p>
                )}

                {leads.map((lead) => (
                  <div key={lead.id} style={leadCard}>
                    <strong>{lead.name || "Unnamed lead"}</strong>

                    <span style={mutedSmall}>
                      {lead.email || "No email"}
                    </span>

                    <span style={leadSite}>
                      {lead.site_name || lead.site_id}
                    </span>

                    {lead.message && (
                      <p style={leadMessage}>{lead.message}</p>
                    )}

                    {lead.created_at && (
                      <span style={leadDate}>
                        {new Date(lead.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={factsBox}>
              <h3 style={{ marginTop: 0 }}>Project facts</h3>

              <p style={mutedSmall}>Pages: {Object.keys(files).length || 0}</p>

              <p style={mutedSmall}>Template: {template}</p>

              <p style={mutedSmall}>Style: {style}</p>

              <p style={mutedSmall}>Audience: {audience}</p>

              <p style={mutedSmall}>User: {userEmail}</p>

              {selectedText && (
                <p style={mutedSmall}>Last selected: {selectedText}</p>
              )}
            </div>

            <button onClick={logout} style={logoutBtn}>
              Log out
            </button>
          </div>
        )}
      </header>

      <section style={stageWrap}>
        <div ref={previewOuterRef} style={stage}>
          {previewHtml ? (
            <div
              style={{
                ...canvas,
                transform: `scale(${scale})`,
              }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                style={iframe}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          ) : (
            <div style={empty}>
              <h2>Start building</h2>

              <p>Use the chat below to build your website.</p>
            </div>
          )}
        </div>
      </section>

      <footer style={bottomBar}>
        <div style={chatStrip}>
          <div style={miniChat}>
            {messages.slice(-4).map((m, i) => (
              <div key={i} style={miniMessage}>
                <b>{m.role === "user" ? "You" : "AI"}:</b> {m.text}
              </div>
            ))}

            {loading && (
              <div style={thinking}>
                <span style={pulse} />
                Streaming generation...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={composer}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                html
                  ? "Ask AI to change the site..."
                  : "Describe what to build..."
              }
              style={textarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();

                  edit();
                }
              }}
            />

            <button onClick={edit} disabled={loading} style={send}>
              ↑
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

const startPage: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(34,197,94,.22), transparent 32%), #09090b",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  padding: 24,
};

const startCard: React.CSSProperties = {
  width: "min(860px, 100%)",
  padding: 34,
  borderRadius: 30,
  background: "#0f0f12",
  border: "1px solid rgba(255,255,255,.08)",
  boxShadow: "0 30px 120px rgba(0,0,0,.45)",
};

const eyebrow: React.CSSProperties = {
  color: "#86efac",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const startTitle: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 1,
  margin: "10px 0",
};

const startText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 18,
  lineHeight: 1.6,
};

const startGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const bigTextArea: React.CSSProperties = {
  width: "100%",
  height: 110,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.08)",
  background: "#111114",
  color: "#fff",
  outline: "none",
  resize: "none",
};

const startButton: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  padding: 16,
  borderRadius: 999,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 950,
  cursor: "pointer",
};

const starterGrid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 18,
};

const starterPill: React.CSSProperties = {
  padding: "10px 13px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  cursor: "pointer",
};

const app: React.CSSProperties = {
  height: "100vh",
  display: "grid",
  gridTemplateRows: "auto minmax(0,1fr) 190px",
  background: "#09090b",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  overflow: "hidden",
};

const topbar: React.CSSProperties = {
  position: "relative",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "#0f0f12",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brand: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const mark: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "linear-gradient(135deg,#22c55e,#a7f3d0)",
  color: "#052e16",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
};

const markSmall: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "linear-gradient(135deg,#22c55e,#a7f3d0)",
  color: "#052e16",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
};

const topActions: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const tabBtn: React.CSSProperties = {
  padding: "9px 13px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  fontWeight: 800,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const publishBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 950,
  cursor: "pointer",
};

const dots: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  fontSize: 24,
  cursor: "pointer",
};

const menu: React.CSSProperties = {
  position: "absolute",
  right: 18,
  top: 66,
  width: 380,
  maxHeight: "calc(100vh - 90px)",
  overflowY: "auto",
  padding: 18,
  borderRadius: 22,
  background: "#0f0f12",
  border: "1px solid rgba(255,255,255,.1)",
  boxShadow: "0 30px 100px rgba(0,0,0,.55)",
  zIndex: 20,
};

const stageWrap: React.CSSProperties = {
  minHeight: 0,
  padding: 18,
};

const stage: React.CSSProperties = {
  height: "100%",
  overflow: "auto",
  background: "#111114",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 24,
  padding: 20,
};

const canvas: React.CSSProperties = {
  width: 1440,
  minHeight: 1100,
  transformOrigin: "top left",
  background: "#fff",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(0,0,0,.55)",
};

const iframe: React.CSSProperties = {
  width: 1440,
  height: 1100,
  border: "none",
  display: "block",
  background: "#fff",
};

const empty: React.CSSProperties = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#e5e7eb",
  textAlign: "center",
};

const bottomBar: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,.08)",
  background: "#0f0f12",
  padding: 14,
};

const chatStrip: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1.6fr",
  gap: 14,
  height: "100%",
};

const miniChat: React.CSSProperties = {
  overflowY: "auto",
  padding: 12,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(255,255,255,.06)",
};

const miniMessage: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: 13,
  marginBottom: 8,
};

const composer: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 48px",
  gap: 10,
  alignItems: "end",
};

const textarea: React.CSSProperties = {
  height: 128,
  padding: 15,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,.08)",
  background: "#111114",
  color: "#fff",
  outline: "none",
  resize: "none",
};

const send: React.CSSProperties = {
  height: 48,
  borderRadius: 999,
  border: "none",
  background: "#fff",
  color: "#09090b",
  fontWeight: 950,
  cursor: "pointer",
};

const mutedSmall: React.CSSProperties = {
  margin: 0,
  color: "#9ca3af",
  fontSize: 12,
  lineHeight: 1.45,
};

const thinking: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#a7f3d0",
  fontSize: 13,
  padding: 10,
};

const pulse: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: "50%",
  background: "#22c55e",
  boxShadow: "0 0 24px #22c55e",
};

const label: React.CSSProperties = {
  display: "block",
  marginTop: 18,
  marginBottom: 8,
  color: "#d1d5db",
  fontSize: 13,
  fontWeight: 800,
};

const field: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.08)",
  background: "#111114",
  color: "#fff",
  outline: "none",
};

const linkBox: React.CSSProperties = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  background: "rgba(34,197,94,.12)",
  border: "1px solid rgba(34,197,94,.25)",
};

const projectsBox: React.CSSProperties = {
  marginTop: 24,
  padding: 14,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(255,255,255,.06)",
};

const leadsBox: React.CSSProperties = {
  marginTop: 18,
  padding: 14,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(34,197,94,.16)",
};

const factsBox: React.CSSProperties = {
  marginTop: 18,
  padding: 14,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(255,255,255,.06)",
};

const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const refresh: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  cursor: "pointer",
};

const projectCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
  display: "grid",
  gap: 4,
};

const leadCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(34,197,94,.16)",
  background: "rgba(34,197,94,.06)",
  color: "#fff",
  display: "grid",
  gap: 5,
};

const leadSite: React.CSSProperties = {
  color: "#86efac",
  fontSize: 11,
};

const leadMessage: React.CSSProperties = {
  margin: "6px 0",
  color: "#d1d5db",
  fontSize: 13,
  lineHeight: 1.45,
};

const leadDate: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
};

const logoutBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  padding: 14,
  borderRadius: 999,
  border: "none",
  background: "rgba(239,68,68,.16)",
  color: "#fecaca",
  fontWeight: 900,
  cursor: "pointer",
};