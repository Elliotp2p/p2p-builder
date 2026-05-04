"use client";

import { useEffect, useRef, useState } from "react";

const problems = [
  "AI receptionist för tandläkare",
  "App som planerar veckans mat",
  "Marketplace för lokala tränare",
  "AI lead finder för småföretag",
  "Smart städplanerare för hem",
];

const templates = [
  "SaaS Landing Page",
  "Mobile App",
  "Agency Website",
  "Marketplace",
  "AI Tool",
  "Local Business",
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

export default function BuilderPage() {
  const [problem, setProblem] = useState(problems[0]);
  const [template, setTemplate] = useState(templates[0]);
  const [style, setStyle] = useState("premium modern");
  const [audience, setAudience] = useState("kunder som vill spara tid");

  const [html, setHtml] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSettings, setShowSettings] = useState(true);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "What should we build today?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previewOuterRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.6);

  const previewHtml = html
    ? html.replace(
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
          }
          body > * {
            transform: none !important;
            zoom: 1 !important;
          }
          main, section, header, footer, nav {
            width: 100% !important;
          }
        </style></head>`
      )
    : "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const loadProjects = async () => {
    const res = await fetch("/api/sites");
    const data = await res.json();
    setProjects(data.sites || []);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    fetch(`/api/site?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.site) {
          setHtml(data.site.html);
          setProblem(data.site.problem || problems[0]);
          setTemplate(data.site.template || templates[0]);
          setStatus("Project loaded");
          setMessages([
            {
              role: "ai",
              text: "Project loaded. You can keep editing it here.",
            },
          ]);
        }
      });
  }, []);

  const addUser = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  };

  const addAI = async (text: string) => {
    setMessages((m) => [...m, { role: "ai", text: "" }]);

    for (let i = 0; i <= text.length; i++) {
      await new Promise((r) => setTimeout(r, 7));
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "ai", text: text.slice(0, i) };
        return copy;
      });
    }
  };

  const runBuild = async (customProblem?: string) => {
    const finalProblem = customProblem || problem;

    setLoading(true);
    setLink("");
    setStatus("Building");
    addUser(finalProblem);

    await addAI("Understanding the product...");
    await addAI("Designing the first version...");
    await addAI("Generating the website...");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: finalProblem, template, style, audience }),
    });

    const data = await res.json();
    const generatedHtml = data.files?.["index.html"];

    if (!generatedHtml) {
      setStatus("Error");
      await addAI("Something went wrong. No HTML came back.");
      setLoading(false);
      return;
    }

    setProblem(finalProblem);
    setHtml(generatedHtml);
    setStatus("Preview updated");
    await addAI("Done. Preview updated.");
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
    setStatus("Editing");
    addUser(instruction);

    await addAI("Reading your request...");
    await addAI("Updating the design...");
    await addAI("Rendering the new version...");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editWebsite: true,
        currentHtml: html,
        instruction,
        problem,
      }),
    });

    const data = await res.json();
    const newHtml = data.files?.["index.html"];

    if (newHtml) {
      setHtml(newHtml);
      setStatus("Edited");
      await addAI("Done. I updated the website.");
    } else {
      setStatus("Error");
      await addAI("I couldn't update the website this time.");
    }

    setLoading(false);
  };

  const publish = async () => {
    if (!html) {
      setStatus("Generate first");
      return;
    }

    setStatus("Publishing");
    await addAI("Publishing the page and creating a live link...");

    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        name: problem,
        problem,
        template,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("Publish error");
      await addAI("Publish error: " + data.error);
      return;
    }

    const fullUrl = window.location.origin + data.url;
    setLink(fullUrl);
    setStatus("Published");
    await addAI("Published. Your live link is ready.");
    loadProjects();
  };

  const openProject = (id: string) => {
    window.location.href = `/builder?id=${id}`;
  };

  return (
    <main style={app}>
      <aside style={sidebar}>
        <div style={brand}>
          <div style={mark}>P</div>
          <div>
            <strong>Problem to Profit</strong>
            <p style={mutedSmall}>AI website builder</p>
          </div>
        </div>

        <div style={chatArea}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...message,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#fff" : "rgba(255,255,255,.06)",
                color: m.role === "user" ? "#020617" : "#e5e7eb",
                border:
                  m.role === "user"
                    ? "1px solid rgba(255,255,255,.7)"
                    : "1px solid rgba(255,255,255,.08)",
              }}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div style={thinking}>
              <span style={pulse} />
              Agent is working
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={starterBox}>
          <p style={mutedSmall}>Try one</p>
          {problems.slice(0, 3).map((p) => (
            <button key={p} onClick={() => runBuild(p)} disabled={loading} style={starter}>
              {p}
            </button>
          ))}
        </div>

        <div style={composer}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              html
                ? "Ask for a change..."
                : "Describe the website you want..."
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
      </aside>

      <section style={workspace}>
        <header style={topbar}>
          <div>
            <strong>Desktop canvas</strong>
            <p style={mutedSmall}>
              {status} · 1440px · {Math.round(scale * 100)}%
            </p>
          </div>

          <div style={actions}>
            <button onClick={() => setShowSettings(!showSettings)} style={ghost}>
              Settings
            </button>
            <button onClick={() => runBuild()} disabled={loading} style={ghost}>
              Regenerate
            </button>
            <button onClick={publish} disabled={loading} style={publishBtn}>
              Publish
            </button>
          </div>
        </header>

        <div ref={previewOuterRef} style={stage}>
          {previewHtml ? (
            <div
              style={{
                ...canvas,
                transform: `scale(${scale})`,
              }}
            >
              <iframe srcDoc={previewHtml} style={iframe} sandbox="allow-scripts allow-same-origin" />
            </div>
          ) : (
            <div style={empty}>
              <h2>Start building</h2>
              <p>Describe an idea in the chat or pick a quick start.</p>
            </div>
          )}
        </div>
      </section>

      {showSettings && (
        <aside style={rightPanel}>
          <h3 style={{ marginTop: 0 }}>Project settings</h3>

          <label style={label}>Template</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} style={field}>
            {templates.map((t) => (
              <option key={t} value={t} style={{ color: "#000" }}>
                {t}
              </option>
            ))}
          </select>

          <label style={label}>Problem</label>
          <input value={problem} onChange={(e) => setProblem(e.target.value)} style={field} />

          <label style={label}>Style</label>
          <input value={style} onChange={(e) => setStyle(e.target.value)} style={field} />

          <label style={label}>Audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} style={field} />

          <button onClick={() => runBuild()} disabled={loading} style={bigButton}>
            {loading ? "Building..." : "Build project"}
          </button>

          {link && (
            <div style={linkBox}>
              <p style={{ margin: 0, marginBottom: 8 }}>Live link</p>
              <a href={link} target="_blank" style={{ color: "#86efac", wordBreak: "break-all" }}>
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
              {projects.length === 0 && <p style={mutedSmall}>No projects yet.</p>}

              {projects.map((p) => (
                <button key={p.id} onClick={() => openProject(p.id)} style={projectCard}>
                  <strong>{p.name || "Untitled project"}</strong>
                  <span style={mutedSmall}>{p.template}</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Open in builder</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}

const app: React.CSSProperties = {
  height: "100vh",
  display: "grid",
  gridTemplateColumns: "380px minmax(0,1fr) 330px",
  background: "#09090b",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  overflow: "hidden",
};

const sidebar: React.CSSProperties = {
  padding: 18,
  borderRight: "1px solid rgba(255,255,255,.08)",
  background: "#0f0f12",
  display: "grid",
  gridTemplateRows: "auto minmax(0,1fr) auto auto",
  gap: 14,
  minHeight: 0,
};

const brand: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const mark: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "linear-gradient(135deg,#22c55e,#a7f3d0)",
  color: "#052e16",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
};

const mutedSmall: React.CSSProperties = {
  margin: 0,
  color: "#9ca3af",
  fontSize: 12,
  lineHeight: 1.45,
};

const chatArea: React.CSSProperties = {
  overflowY: "auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 12,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(255,255,255,.06)",
};

const message: React.CSSProperties = {
  maxWidth: "88%",
  padding: "12px 14px",
  borderRadius: 18,
  fontSize: 14,
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

const starterBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  background: "#111114",
  border: "1px solid rgba(255,255,255,.06)",
};

const starter: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const composer: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 44px",
  gap: 10,
};

const textarea: React.CSSProperties = {
  height: 86,
  padding: 13,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.08)",
  background: "#111114",
  color: "#fff",
  outline: "none",
  resize: "none",
};

const send: React.CSSProperties = {
  height: 44,
  alignSelf: "end",
  borderRadius: 999,
  border: "none",
  background: "#fff",
  color: "#09090b",
  fontWeight: 950,
  cursor: "pointer",
};

const workspace: React.CSSProperties = {
  padding: 18,
  display: "grid",
  gridTemplateRows: "auto minmax(0,1fr)",
  gap: 14,
  minWidth: 0,
  minHeight: 0,
};

const topbar: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#0f0f12",
  border: "1px solid rgba(255,255,255,.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 10,
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

const stage: React.CSSProperties = {
  minHeight: 0,
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

const rightPanel: React.CSSProperties = {
  padding: 18,
  background: "#0f0f12",
  borderLeft: "1px solid rgba(255,255,255,.08)",
  overflowY: "auto",
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

const bigButton: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  padding: 14,
  borderRadius: 999,
  border: "none",
  background: "#fff",
  color: "#09090b",
  fontWeight: 950,
  cursor: "pointer",
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