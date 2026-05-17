"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SECTION_TYPES = [
  "Testimonials",
  "FAQ",
  "Features",
  "Stats",
  "CTA",
  "Pricing",
  "Gallery",
  "Process",
];

const STARTER_IDEAS = [
  "Luxury Nordic travel website for Gothenburg with cinematic harbor photography",
  "Premium Italian pizza restaurant with dark cinematic design",
  "Minimal Apple-style AI startup landing page",
  "Luxury hotel website for Mallorca with editorial photography",
  "Modern fintech startup inspired by Stripe",
  "Scandinavian architecture studio portfolio",
  "Luxury skincare ecommerce brand",
  "Modern gym website with booking and membership plans",
  "AI CRM platform for real estate agencies",
  "High-end coffee brand with calm beige aesthetic",
];

const QUICK_ACTIONS = [
  "Make it more premium",
  "Make it look like Apple",
  "Make it more cinematic",
  "Improve the hero section",
  "Add more trust and conversion",
  "Make the design less generic",
];

const FILE_TABS = [
  { label: "Home", file: "index.html" },
  { label: "Pricing", file: "pricing.html" },
  { label: "About", file: "about.html" },
  { label: "Contact", file: "contact.html" },
] as const;

type ChatMessage = { role: "user" | "ai"; text: string };

type Project = {
  id: string;
  slug?: string;
  name: string;
  problem: string;
  template?: string;
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

type ActivePanel = "sections" | "projects" | "publish" | null;

function buildPreviewHtml(html: string): string {
  return html
    .replace(
      /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*)>/gi,
      (_m, before, _quote, href, after) => {
        const safe = String(href || "").replaceAll('"', "&quot;");
        return `<a ${before} href="javascript:void(0)" data-builder-href="${safe}" ${after}>`;
      }
    )
    .replace(/<button\b([^>]*)>/gi, '<button type="button" $1>')
    .replace(
      "</head>",
      `<style>
        html,body{width:1440px!important;min-height:100vh!important;margin:0!important;padding:0!important;transform:none!important;zoom:1!important}
        body{display:block!important;overflow-x:hidden!important}
        main,section,header,footer,nav{width:100%!important}
        a,button{pointer-events:auto!important;cursor:pointer!important}
        h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover,p:hover,span:hover{outline:2px solid #a78bfa!important;outline-offset:4px!important;cursor:pointer!important}
      </style></head>`
    );
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function BuilderPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [loginStatus, setLoginStatus] = useState("");

  const [problem, setProblem] = useState("");
  const [started, setStarted] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState("index.html");

  const html = files[activeFile] || files["index.html"] || "";
  const previewHtml = html ? buildPreviewHtml(html) : "";

  const [link, setLink] = useState("");
  const [publishToast, setPublishToast] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [status, setStatus] = useState("Ready");
  const [lastSaved, setLastSaved] = useState("");
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [chatInput, setChatInput] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

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

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }, [supabase]);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getAccessToken();
      const headers = new Headers(options.headers || {});

      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return fetch(url, { ...options, headers });
    },
    [getAccessToken]
  );

  const addMessage = useCallback((role: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  }, []);

  const saveDraftLocal = useCallback(() => {
    if (!files["index.html"]) return;

    localStorage.setItem(
      "p2p-builder-autosave",
      JSON.stringify({
        files,
        activeFile,
        problem,
        customSlug,
        savedAt: new Date().toISOString(),
      })
    );

    setLastSaved(new Date().toLocaleTimeString());
  }, [files, activeFile, problem, customSlug]);

  const readStream = useCallback(
    async (res: Response) => {
      if (!res.ok) {
        let errorMessage = "Request failed";

        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = await res.text();
        }

        throw new Error(errorMessage);
      }

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
            addMessage("ai", payload.text);
          }

          if (payload.type === "review") {
            addMessage("ai", payload.text || "No review returned.");
          }

          if (payload.type === "files") {
            const incoming = payload.files || {};

            setFiles((prev) => ({
              ...prev,
              ...incoming,
            }));

            if (incoming["index.html"]) {
              setActiveFile("index.html");
            }
          }

          if (payload.type === "error") {
            setStatus("Error");
            addMessage("ai", payload.text || "Something went wrong.");
          }

          if (payload.type === "done") {
            setStatus("Done");
          }
        }
      }
    },
    [addMessage]
  );

  const loadProjects = useCallback(async () => {
    try {
      const res = await authFetch("/api/sites");
      if (!res.ok) return;

      const data = await res.json();
      setProjects(data.sites || []);
    } catch {
      // ignore
    }
  }, [authFetch]);

  const loadLeads = useCallback(async () => {
    try {
      const res = await authFetch("/api/leads");
      if (!res.ok) return;

      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      // ignore
    }
  }, [authFetch]);

  const runBuild = useCallback(
    async (customProblem?: string) => {
      const finalProblem = customProblem || problem || chatInput;
      if (!finalProblem.trim()) return;

      setStarted(true);
      setLoading(true);
      setLink("");
      setStatus("Starting...");
      addMessage("user", finalProblem);

      try {
        const res = await authFetch("/api/coach", {
          method: "POST",
          body: JSON.stringify({
            problem: finalProblem,
          }),
        });

        setProblem(finalProblem);
        setCustomSlug((prev) => prev || createSlug(finalProblem));
        setChatInput("");

        await readStream(res);
        setStatus("Preview updated");
      } catch (error: any) {
        setStatus("Error");
        addMessage("ai", "Build error: " + (error.message || "Try again."));
      }

      setLoading(false);
    },
    [problem, chatInput, authFetch, readStream, addMessage]
  );

  const edit = useCallback(
    async (customInstruction?: string) => {
      const instruction = customInstruction || chatInput;
      if (!instruction.trim()) return;

      setChatInput("");

      if (!html) {
        await runBuild(instruction);
        return;
      }

      setLoading(true);
      setStatus("Editing...");
      addMessage("user", instruction);

      try {
        const res = await authFetch("/api/coach", {
          method: "POST",
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
      } catch (error: any) {
        setStatus("Error");
        addMessage("ai", "Edit error: " + (error.message || "Network error."));
      }

      setLoading(false);
    },
    [
      chatInput,
      html,
      runBuild,
      authFetch,
      readStream,
      addMessage,
      problem,
      activeFile,
      files,
    ]
  );

  const addSection = useCallback(
    async (sectionType: string) => {
      if (!html) {
        setStatus("Generate first");
        return;
      }

      const instruction = `Add a premium ${sectionType} section to the active page. Match current design perfectly. Insert before final CTA or footer. Return complete updated HTML.`;

      setLoading(true);
      setStatus(`Adding ${sectionType}...`);
      addMessage("user", `Add ${sectionType} section`);

      try {
        const res = await authFetch("/api/coach", {
          method: "POST",
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
        setStatus(`${sectionType} added`);
      } catch (error: any) {
        setStatus("Error");
        addMessage("ai", "Section error: " + (error.message || "Unknown error"));
      }

      setLoading(false);
    },
    [html, authFetch, readStream, addMessage, problem, activeFile, files]
  );

  const generateHeroImage = useCallback(async () => {
    if (!html) {
      setStatus("Generate first");
      return;
    }

    const prompt =
      imagePrompt ||
      problem ||
      "premium startup hero image, cinematic modern website visual";

    setLoading(true);
    setStatus("Generating image...");
    addMessage("user", "Generate hero image: " + prompt);

    try {
      const res = await authFetch("/api/image", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Image generation failed");
      }

      const img = `<img src="${data.image}" alt="AI hero" style="width:100%;max-width:720px;border-radius:28px;box-shadow:0 30px 100px rgba(0,0,0,.35);object-fit:cover;" />`;

      let updated = html;

      if (/<img[^>]*>/i.test(updated)) {
        updated = updated.replace(/<img[^>]*>/i, img);
      } else if (/<\/section>/i.test(updated)) {
        updated = updated.replace(/<\/section>/i, `${img}</section>`);
      } else {
        updated = updated.replace(/<body[^>]*>/i, (match) => `${match}${img}`);
      }

      setFiles((prev) => ({
        ...prev,
        [activeFile]: updated,
      }));

      setImagePrompt("");
      setStatus("Image added");
      addMessage("ai", "Hero image generated and added.");
    } catch (error: any) {
      setStatus("Error");
      addMessage("ai", "Image error: " + (error.message || "Unknown error"));
    }

    setLoading(false);
  }, [html, imagePrompt, problem, authFetch, addMessage, activeFile]);

  const reviewSite = useCallback(async () => {
    if (!html) {
      setStatus("Generate first");
      return;
    }

    setLoading(true);
    setStatus("Reviewing...");
    addMessage("user", "Review this website");

    try {
      const res = await authFetch("/api/coach", {
        method: "POST",
        body: JSON.stringify({
          reviewWebsite: true,
          currentHtml: html,
          problem,
          activeFile,
          allFiles: files,
        }),
      });

      await readStream(res);
      setStatus("Review done");
    } catch (error: any) {
      setStatus("Error");
      addMessage("ai", "Review error: " + (error.message || "Unknown error"));
    }

    setLoading(false);
  }, [html, authFetch, readStream, addMessage, problem, activeFile, files]);

  const publish = useCallback(async () => {
    if (!files["index.html"]) {
      setStatus("Generate first");
      return;
    }

    const slug = createSlug(customSlug || problem);

    setStatus("Publishing...");
    addMessage("ai", "Publishing and creating live link...");

    try {
      const res = await authFetch("/api/save", {
        method: "POST",
        body: JSON.stringify({
          html: files["index.html"],
          files,
          name: problem,
          problem,
          slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage("ai", "Publish error: " + (data.error || "Unknown"));
        setStatus("Publish error");
        return;
      }

      const fullUrl = window.location.origin + data.url;

      setLink(fullUrl);
      setPublishToast(fullUrl);
      setStatus("Published");
      addMessage("ai", "Published. Your live link is ready.");

      setTimeout(() => {
        setPublishToast("");
      }, 10000);

      localStorage.removeItem("p2p-builder-autosave");
      setLastSaved("");

      loadProjects();
      loadLeads();
    } catch (error: any) {
      setStatus("Error");
      addMessage("ai", "Publish error: " + (error.message || "Unknown error"));
    }
  }, [
    files,
    problem,
    customSlug,
    authFetch,
    addMessage,
    loadProjects,
    loadLeads,
  ]);

  const copyLink = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied link");
    } catch {
      setStatus("Copy failed");
    }
  }, []);

  const deleteProject = useCallback(
    async (id: string, name?: string) => {
      const sure = window.confirm(
        `Delete "${name || "this project"}"? This cannot be undone.`
      );

      if (!sure) return;

      try {
        const res = await authFetch(`/api/sites?id=${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          addMessage("ai", "Delete error: " + (data.error || "Unknown error"));
          return;
        }

        setProjects((prev) => prev.filter((p) => p.id !== id));
        setLeads((prev) => prev.filter((lead) => lead.site_id !== id));
        addMessage("ai", "Project deleted.");
      } catch (error: any) {
        addMessage("ai", "Delete error: " + (error.message || "Unknown error"));
      }
    },
    [authFetch, addMessage]
  );

  const login = useCallback(async () => {
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
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.reload();
  }, [supabase]);

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
    const saved = localStorage.getItem("p2p-builder-autosave");
    if (!saved) return;

    try {
      const draft = JSON.parse(saved);

      if (draft?.files?.["index.html"]) {
        setFiles(draft.files);
        setActiveFile(draft.activeFile || "index.html");
        setProblem(draft.problem || "");
        setCustomSlug(draft.customSlug || createSlug(draft.problem || ""));
        setStarted(true);
        setStatus("Autosave restored");

        if (draft.savedAt) {
          setLastSaved(new Date(draft.savedAt).toLocaleTimeString());
        }

        setMessages([
          {
            role: "ai",
            text: "Autosaved draft restored. Continue editing or publish.",
          },
        ]);
      }
    } catch {
      localStorage.removeItem("p2p-builder-autosave");
    }
  }, []);

  useEffect(() => {
    if (!started || !files["index.html"]) return;

    const timeout = setTimeout(saveDraftLocal, 2000);
    return () => clearTimeout(timeout);
  }, [files, problem, customSlug, activeFile, started, saveDraftLocal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const updateScale = () => {
      if (!previewOuterRef.current) return;
      setScale(Math.min((previewOuterRef.current.clientWidth - 56) / 1440, 1));
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !previewHtml) return;

    const inject = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const goToPage = (value: string) => {
        const lower = value.toLowerCase();

        if (
          lower.includes("pricing") ||
          lower.includes("pris") ||
          lower.includes("plan")
        ) {
          setActiveFile("pricing.html");
          return;
        }

        if (lower.includes("about") || lower.includes("om oss")) {
          setActiveFile("about.html");
          return;
        }

        if (
          lower.includes("contact") ||
          lower.includes("kontakt") ||
          lower.includes("demo")
        ) {
          setActiveFile("contact.html");
          return;
        }

        if (lower.includes("home") || lower.includes("start")) {
          setActiveFile("index.html");
        }
      };

      doc.addEventListener(
        "click",
        (e: any) => {
          const target = e.target as HTMLElement;
          const clickable = target.closest("a,button") as HTMLElement | null;

          if (clickable) {
            e.preventDefault();
            e.stopPropagation();

            const href =
              clickable.getAttribute("data-builder-href") ||
              clickable.getAttribute("href") ||
              "";

            goToPage(href + " " + (clickable.innerText || ""));
          }
        },
        true
      );

      doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span").forEach((el: any) => {
        if (el.closest("a,button")) return;

        el.style.cursor = "pointer";

        el.onclick = (e: any) => {
          e.preventDefault();
          e.stopPropagation();

          const text = el.innerText || "";
          if (!text.trim()) return;

          const replacement = prompt("Edit text:", text);

          if (replacement && replacement !== text) {
            setFiles((prev) => ({
              ...prev,
              [activeFile]: html.replace(text, replacement),
            }));

            setStatus("Text edited");
          }
        };
      });
    };

    const timeout = setTimeout(inject, 600);
    return () => clearTimeout(timeout);
  }, [previewHtml, activeFile, html]);

  useEffect(() => {
    if (userEmail) {
      loadProjects();
      loadLeads();
    }
  }, [userEmail, loadProjects, loadLeads]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const idea = params.get("idea");

    if (idea || !id) return;

    setStarted(true);

    fetch(`/api/site?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.site) return;

        setFiles(data.site.html_files || { "index.html": data.site.html });
        setActiveFile("index.html");
        setProblem(data.site.problem || "");
        setCustomSlug(data.site.slug || createSlug(data.site.problem || ""));
        setStatus("Project loaded");
        setMessages([
          {
            role: "ai",
            text: "Project loaded. I can edit the full multi-page site.",
          },
        ]);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idea = params.get("idea");

    if (!idea) return;

    localStorage.removeItem("p2p-builder-autosave");

    setFiles({});
    setActiveFile("index.html");
    setLink("");
    setLastSaved("");
    setProblem(idea);
    setCustomSlug(createSlug(idea));
    setStarted(true);
    setMessages([
      {
        role: "ai",
        text: "Starting a new website from this idea.",
      },
    ]);

    window.history.replaceState({}, "", "/builder");

    setTimeout(() => {
      runBuild(idea);
    }, 300);
  }, [runBuild]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && chatInput.trim()) {
        e.preventDefault();
        edit();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        publish();
      }

      if (e.key === "Escape") {
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chatInput, edit, publish]);

  const statusColor =
    status === "Error" || status.includes("error")
      ? "#fb7185"
      : status === "Published" ||
        status === "Edited" ||
        status === "Preview updated" ||
        status === "Done"
      ? "#4ade80"
      : "#a1a1aa";

  if (checkingAuth) {
    return (
      <main style={s.splash}>
        <div style={s.splashInner}>
          <div style={s.logo}>P</div>
          <p style={s.splashMuted}>Loading workspace...</p>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main style={s.splash}>
        <div style={s.card}>
          <div style={s.logo}>P</div>
          <p style={s.eyebrow}>Problem to Profit</p>
          <h1 style={s.cardTitle}>Build sites with AI</h1>
          <p style={s.cardText}>
            Log in to generate premium websites, edit them with chat and publish
            them instantly.
          </p>

          <button onClick={login} style={s.primaryBtn}>
            Continue with Google
          </button>

          {loginStatus && <p style={s.muted}>{loginStatus}</p>}
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main style={s.splash}>
        <div style={s.homeShell}>
          <div style={s.heroCard}>
            <div style={s.logo}>P</div>
            <p style={s.eyebrow}>Problem to Profit AI</p>
            <h1 style={s.heroTitle}>What should we build?</h1>
            <p style={s.heroText}>
              Describe the website. AI chooses the layout, images, design
              system, sections and conversion flow automatically.
            </p>

            <textarea
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                setCustomSlug(createSlug(e.target.value));
              }}
              placeholder="Ex: Premium Italian pizza restaurant with dark cinematic design"
              style={s.bigTextarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  runBuild();
                }
              }}
            />

            <div style={s.startActions}>
              <button
                onClick={() => runBuild()}
                disabled={loading || !problem.trim()}
                style={{
                  ...s.primaryBtn,
                  opacity: problem.trim() ? 1 : 0.45,
                }}
              >
                {loading ? "Building..." : "Generate website"}
              </button>
            </div>

            <div style={s.starterGrid}>
              {STARTER_IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => {
                    setProblem(idea);
                    setCustomSlug(createSlug(idea));
                    runBuild(idea);
                  }}
                  style={s.starterPill}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div style={s.previewTeaser}>
            <div style={s.teaserTop}>
              <span />
              <span />
              <span />
            </div>
            <div style={s.teaserHero} />
            <div style={s.teaserGrid}>
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={s.app}>
      {publishToast && (
        <div style={s.toast}>
          <div>
            <strong style={{ color: "#4ade80" }}>Published</strong>
            <p style={s.toastUrl}>{publishToast}</p>
          </div>

          <button onClick={() => copyLink(publishToast)} style={s.toastBtn}>
            Copy
          </button>

          <a href={publishToast} target="_blank" style={s.toastBtn}>
            Open
          </a>

          <button onClick={() => setPublishToast("")} style={s.toastClose}>
            ×
          </button>
        </div>
      )}

      <header style={s.topbar}>
        <div style={s.brand}>
          <div style={s.logoSmall}>P</div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontSize: 13 }}>Problem to Profit</strong>
            <div style={s.statusLine}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: statusColor,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: statusColor, fontWeight: 700 }}>
                {status}
              </span>
              <span style={s.dot}>·</span>
              <span>{activeFile}</span>
              {lastSaved && (
                <>
                  <span style={s.dot}>·</span>
                  <span>Saved {lastSaved}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={s.topActions}>
          {FILE_TABS.map((tab) => (
            <button
              key={tab.file}
              onClick={() => files[tab.file] && setActiveFile(tab.file)}
              disabled={!files[tab.file]}
              style={{
                ...s.tabBtn,
                background:
                  activeFile === tab.file ? "rgba(255,255,255,.12)" : "transparent",
                borderColor:
                  activeFile === tab.file
                    ? "rgba(255,255,255,.18)"
                    : "transparent",
                color: activeFile === tab.file ? "#fff" : "#a1a1aa",
                opacity: files[tab.file] ? 1 : 0.28,
              }}
            >
              {tab.label}
            </button>
          ))}

          <div style={s.divider} />

          <button onClick={reviewSite} disabled={loading} style={s.ghostBtn}>
            Review
          </button>

          <button onClick={() => runBuild()} disabled={loading} style={s.ghostBtn}>
            Regen
          </button>

          <button
            onClick={() =>
              setActivePanel(activePanel === "sections" ? null : "sections")
            }
            style={{
              ...s.ghostBtn,
              color: activePanel === "sections" ? "#c4b5fd" : "#fff",
            }}
          >
            + Section
          </button>

          <button
            onClick={() =>
              setActivePanel(activePanel === "projects" ? null : "projects")
            }
            style={{
              ...s.ghostBtn,
              color: activePanel === "projects" ? "#93c5fd" : "#fff",
            }}
          >
            Projects
          </button>

          <button
            onClick={() =>
              setActivePanel(activePanel === "publish" ? null : "publish")
            }
            style={s.publishBtn}
          >
            Publish
          </button>
        </div>
      </header>

      {activePanel && (
        <aside style={s.sidePanel}>
          <div style={s.sidePanelHeader}>
            <strong>
              {activePanel === "sections"
                ? "Add sections"
                : activePanel === "projects"
                ? "Projects"
                : "Publish"}
            </strong>

            <button onClick={() => setActivePanel(null)} style={s.closeBtn}>
              ×
            </button>
          </div>

          {activePanel === "sections" && (
            <div style={s.panelBody}>
              <p style={s.muted}>Add premium sections to the active page.</p>

              <div style={s.panelGrid}>
                {SECTION_TYPES.map((section) => (
                  <button
                    key={section}
                    onClick={() => addSection(section)}
                    disabled={loading || !html}
                    style={s.panelBtn}
                  >
                    + {section}
                  </button>
                ))}
              </div>

              <div style={s.panelDivider} />

              <p style={s.panelTitle}>AI quick actions</p>

              <div style={s.panelGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => edit(action)}
                    disabled={loading || !html}
                    style={s.panelBtn}
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div style={s.panelDivider} />

              <p style={s.panelTitle}>AI hero image</p>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Ex: cinematic pizza restaurant interior"
                style={s.smallTextarea}
              />

              <button
                onClick={generateHeroImage}
                disabled={loading || !html}
                style={s.panelBtnPrimary}
              >
                Generate image
              </button>
            </div>
          )}

          {activePanel === "projects" && (
            <div style={s.panelBody}>
              <div style={s.rowBetween}>
                <p style={s.muted}>Your published sites</p>
                <button onClick={loadProjects} style={s.refreshBtn}>
                  Refresh
                </button>
              </div>

              {projects.length === 0 && <p style={s.muted}>No projects yet.</p>}

              {projects.map((project) => (
                <div key={project.id} style={s.projectCard}>
                  <button
                    onClick={() => {
                      window.location.href = `/builder?id=${project.id}`;
                    }}
                    style={s.projectOpenBtn}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {project.name || "Untitled"}
                    </strong>
                    <span style={s.muted}>
                      {project.slug ? `/site/${project.slug}` : project.id}
                    </span>
                  </button>

                  <button
                    onClick={() => deleteProject(project.id, project.name)}
                    style={s.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              ))}

              <div style={s.panelDivider} />

              <div style={s.rowBetween}>
                <p style={{ ...s.muted, margin: 0 }}>Leads inbox</p>
                <button onClick={loadLeads} style={s.refreshBtn}>
                  Refresh
                </button>
              </div>

              {leads.length === 0 && <p style={s.muted}>No leads yet.</p>}

              {leads.map((lead) => (
                <div key={lead.id} style={s.leadCard}>
                  <strong style={{ fontSize: 13 }}>
                    {lead.name || "Unnamed"}
                  </strong>
                  <span style={s.muted}>{lead.email || "No email"}</span>

                  {lead.message && <p style={s.leadMessage}>{lead.message}</p>}

                  {lead.created_at && (
                    <span style={s.leadDate}>
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}

              <button onClick={logout} style={s.logoutBtn}>
                Log out
              </button>
            </div>
          )}

          {activePanel === "publish" && (
            <div style={s.panelBody}>
              <p style={s.muted}>Choose a clean URL before publishing.</p>

              <label style={s.label}>Custom URL slug</label>
              <input
                value={customSlug}
                onChange={(e) => setCustomSlug(createSlug(e.target.value))}
                placeholder="my-premium-site"
                style={s.input}
              />

              <div style={s.slugPreview}>
                /site/{customSlug || createSlug(problem) || "my-site"}
              </div>

              <button
                onClick={publish}
                disabled={loading || !files["index.html"]}
                style={s.panelBtnPrimary}
              >
                {loading ? "Publishing..." : "Publish live"}
              </button>

              {link && (
                <div style={s.linkBox}>
                  <p style={{ ...s.muted, marginBottom: 8 }}>Live link</p>
                  <a href={link} target="_blank" style={s.link}>
                    {link}
                  </a>

                  <div style={s.rowGap}>
                    <button onClick={() => copyLink(link)} style={s.miniBtn}>
                      Copy
                    </button>
                    <a href={link} target="_blank" style={s.miniBtn}>
                      Open
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      )}

      <section style={s.stage} ref={previewOuterRef}>
        {previewHtml ? (
          <div style={{ ...s.canvas, transform: `scale(${scale})` }}>
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              style={s.iframe}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        ) : (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>P</div>
            <h2 style={{ margin: "12px 0 6px", fontSize: 22 }}>
              Start building
            </h2>
            <p style={s.muted}>Use the chat below to generate your website.</p>
          </div>
        )}
      </section>

      <footer style={s.bottomBar}>
        <div style={s.chatStrip}>
          <div style={s.messageLog}>
            {messages.slice(-5).map((message, index) => (
              <div
                key={index}
                style={{
                  ...s.msgRow,
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    ...s.msgBubble,
                    background:
                      message.role === "user"
                        ? "rgba(124,58,237,.28)"
                        : "rgba(255,255,255,.06)",
                  }}
                >
                  {message.text}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <span style={s.workingBubble}>
                  <span style={s.pulseDot} /> Working...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={s.composer}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                html
                  ? "Ask AI to change the site..."
                  : "Describe what to build..."
              }
              style={s.composerTextarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  edit();
                }
              }}
            />

            <button
              onClick={() => edit()}
              disabled={loading || !chatInput.trim()}
              style={{
                ...s.sendBtn,
                opacity: chatInput.trim() ? 1 : 0.4,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  splash: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 15% 20%,rgba(124,58,237,.22),transparent 36%),radial-gradient(circle at 85% 20%,rgba(236,72,153,.18),transparent 34%),#050509",
    color: "#fff",
    fontFamily: "'Inter',system-ui,Arial",
    padding: 24,
  },
  splashInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  homeShell: {
    width: "min(1180px,100%)",
    display: "grid",
    gridTemplateColumns: "1.15fr .85fr",
    gap: 22,
    alignItems: "stretch",
  },
  card: {
    width: "min(760px,100%)",
    padding: "36px 40px",
    borderRadius: 30,
    background: "rgba(10,10,18,.86)",
    border: "1px solid rgba(255,255,255,.1)",
    boxShadow: "0 40px 140px rgba(0,0,0,.55)",
    backdropFilter: "blur(18px)",
  },
  heroCard: {
    padding: "38px 42px",
    borderRadius: 34,
    background:
      "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",
    border: "1px solid rgba(255,255,255,.1)",
    boxShadow: "0 40px 140px rgba(0,0,0,.55)",
    backdropFilter: "blur(18px)",
  },
  previewTeaser: {
    borderRadius: 34,
    padding: 18,
    background:
      "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))",
    border: "1px solid rgba(255,255,255,.1)",
    boxShadow: "0 40px 140px rgba(0,0,0,.55)",
    overflow: "hidden",
    minHeight: 520,
  },
  teaserTop: {
    height: 46,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  teaserHero: {
    height: 250,
    borderRadius: 26,
    background:
      "linear-gradient(135deg,rgba(124,58,237,.45),rgba(236,72,153,.22)), radial-gradient(circle at 70% 35%,rgba(255,255,255,.35),transparent 30%)",
    marginBottom: 16,
  },
  teaserGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
  },
  logoSmall: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontSize: 14,
  },
  eyebrow: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    margin: "18px 0 8px",
  },
  cardTitle: {
    fontSize: 52,
    lineHeight: 1.04,
    margin: "6px 0 12px",
    fontWeight: 850,
    letterSpacing: "-.05em",
  },
  heroTitle: {
    fontSize: 72,
    lineHeight: 0.94,
    margin: "8px 0 18px",
    fontWeight: 900,
    letterSpacing: "-.075em",
    maxWidth: 760,
  },
  cardText: {
    color: "#c4c4cc",
    fontSize: 17,
    lineHeight: 1.65,
    margin: "0 0 20px",
  },
  heroText: {
    color: "#c4c4cc",
    fontSize: 18,
    lineHeight: 1.65,
    margin: "0 0 20px",
    maxWidth: 680,
  },
  splashMuted: {
    color: "#71717a",
    fontSize: 14,
  },
  bigTextarea: {
    width: "100%",
    height: 130,
    padding: "16px 18px",
    borderRadius: 22,
    border: "1px solid rgba(167,139,250,.32)",
    background: "rgba(3,7,18,.72)",
    color: "#fff",
    outline: "none",
    resize: "none",
    fontSize: 15,
    lineHeight: 1.65,
    boxSizing: "border-box",
    boxShadow: "0 0 0 1px rgba(236,72,153,.06)",
  },
  startActions: {
    display: "flex",
    gap: 12,
    marginTop: 14,
  },
  primaryBtn: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 850,
    cursor: "pointer",
    fontSize: 15,
    boxShadow: "0 16px 44px rgba(124,58,237,.26)",
    transition: "all .2s",
  },
  starterGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 22,
  },
  starterPill: {
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.045)",
    color: "#d4d4d8",
    cursor: "pointer",
    fontSize: 13,
    transition: "all .15s",
  },
  app: {
    height: "100vh",
    display: "grid",
    gridTemplateRows: "58px minmax(0,1fr) 172px",
    background: "#050509",
    color: "#fff",
    fontFamily: "'Inter',system-ui,Arial",
    overflow: "hidden",
    position: "relative",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,.07)",
    background: "rgba(6,6,12,.96)",
    backdropFilter: "blur(20px)",
    gap: 12,
    zIndex: 100,
  },
  brand: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    minWidth: 0,
  },
  statusLine: {
    margin: 0,
    color: "#71717a",
    fontSize: 12,
    lineHeight: 1.45,
    display: "flex",
    gap: 6,
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  topActions: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    flexShrink: 0,
  },
  tabBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    color: "#a1a1aa",
    fontWeight: 650,
    cursor: "pointer",
    fontSize: 12,
    transition: "all .15s",
  },
  ghostBtn: {
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    fontWeight: 650,
    cursor: "pointer",
    fontSize: 12,
    transition: "all .15s",
    whiteSpace: "nowrap",
  },
  publishBtn: {
    padding: "8px 17px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 850,
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
    boxShadow: "0 6px 22px rgba(124,58,237,.32)",
  },
  divider: {
    width: 1,
    height: 22,
    background: "rgba(255,255,255,.08)",
    margin: "0 4px",
  },
  sidePanel: {
    position: "fixed",
    right: 0,
    top: 58,
    bottom: 172,
    width: 340,
    background: "rgba(8,8,16,.97)",
    borderLeft: "1px solid rgba(255,255,255,.09)",
    zIndex: 200,
    overflowY: "auto",
    backdropFilter: "blur(20px)",
  },
  sidePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 16px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    position: "sticky",
    top: 0,
    background: "rgba(8,8,16,.97)",
    backdropFilter: "blur(20px)",
  },
  panelBody: {
    padding: 16,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 14,
  },
  panelGrid: {
    display: "grid",
    gap: 8,
    marginTop: 12,
  },
  panelBtn: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.045)",
    color: "#e4e4e7",
    fontWeight: 650,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    transition: "all .15s",
  },
  panelBtnPrimary: {
    width: "100%",
    marginTop: 10,
    padding: "13px 14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
  },
  panelDivider: {
    height: 1,
    background: "rgba(255,255,255,.08)",
    margin: "18px 0",
  },
  panelTitle: {
    margin: 0,
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: 800,
  },
  smallTextarea: {
    width: "100%",
    height: 78,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    outline: "none",
    resize: "none",
    fontSize: 13,
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    marginTop: 14,
    marginBottom: 8,
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: 800,
  },
  slugPreview: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    color: "#c4b5fd",
    fontSize: 13,
    wordBreak: "break-all",
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  rowGap: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  projectCard: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.07)",
    background: "rgba(255,255,255,.04)",
    marginTop: 8,
    display: "grid",
    gap: 4,
  },
  projectOpenBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
    display: "grid",
    gap: 3,
    padding: 0,
  },
  deleteBtn: {
    marginTop: 7,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(244,63,94,.3)",
    background: "rgba(244,63,94,.08)",
    color: "#fca5a5",
    fontWeight: 750,
    cursor: "pointer",
    fontSize: 12,
  },
  leadCard: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(167,139,250,.14)",
    background: "rgba(167,139,250,.055)",
    marginTop: 8,
    display: "grid",
    gap: 4,
  },
  leadMessage: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 1.45,
  },
  leadDate: {
    fontSize: 11,
    color: "#52525b",
  },
  linkBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 14,
    background: "rgba(99,102,241,.1)",
    border: "1px solid rgba(167,139,250,.2)",
  },
  link: {
    color: "#c4b5fd",
    fontSize: 13,
    wordBreak: "break-all",
  },
  logoutBtn: {
    width: "100%",
    marginTop: 18,
    padding: 12,
    borderRadius: 999,
    border: "1px solid rgba(244,63,94,.2)",
    background: "rgba(244,63,94,.08)",
    color: "#fca5a5",
    fontWeight: 750,
    cursor: "pointer",
    fontSize: 13,
  },
  refreshBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.04)",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 12,
  },
  miniBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "none",
  },
  stage: {
    position: "relative",
    overflow: "auto",
    background:
      "radial-gradient(circle at 18% 18%,rgba(124,58,237,.12),transparent 28%),radial-gradient(circle at 82% 8%,rgba(236,72,153,.1),transparent 32%),#07070c",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 20,
  },
  canvas: {
    width: 1440,
    minHeight: 1100,
    transformOrigin: "top center",
    background: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow:
      "0 42px 130px rgba(0,0,0,.72),0 0 80px rgba(124,58,237,.14)",
    border: "1px solid rgba(255,255,255,.09)",
  },
  iframe: {
    width: 1440,
    height: 1100,
    border: "none",
    display: "block",
    background: "#fff",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    color: "#e5e7eb",
  },
  emptyIcon: {
    fontSize: 38,
    color: "#3f3f46",
  },
  bottomBar: {
    borderTop: "1px solid rgba(255,255,255,.07)",
    background: "rgba(6,6,12,.965)",
    padding: "12px 16px",
    backdropFilter: "blur(20px)",
  },
  chatStrip: {
    maxWidth: 1220,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1.9fr",
    gap: 12,
    height: "100%",
  },
  messageLog: {
    overflowY: "auto",
    padding: "8px 10px",
    borderRadius: 16,
    background: "rgba(255,255,255,.032)",
    border: "1px solid rgba(255,255,255,.065)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  msgRow: {
    display: "flex",
  },
  msgBubble: {
    maxWidth: "86%",
    padding: "7px 11px",
    borderRadius: 12,
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 1.45,
  },
  workingBubble: {
    maxWidth: "86%",
    padding: "7px 11px",
    borderRadius: 12,
    fontSize: 12,
    color: "#c4b5fd",
    lineHeight: 1.45,
    background: "rgba(255,255,255,.06)",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  composer: {
    display: "grid",
    gridTemplateColumns: "1fr 44px",
    gap: 8,
    alignItems: "end",
  },
  composerTextarea: {
    height: 120,
    padding: "13px 15px",
    borderRadius: 18,
    border: "1px solid rgba(167,139,250,.26)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    outline: "none",
    resize: "none",
    fontSize: 14,
    lineHeight: 1.55,
    boxShadow: "0 0 0 1px rgba(236,72,153,.06)",
  },
  sendBtn: {
    height: 44,
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 18,
    transition: "all .15s",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#a78bfa",
    boxShadow: "0 0 14px #a78bfa",
    display: "inline-block",
  },
  toast: {
    position: "fixed",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    padding: "12px 14px",
    borderRadius: 18,
    background: "rgba(10,10,18,.97)",
    border: "1px solid rgba(255,255,255,.09)",
    boxShadow: "0 20px 100px rgba(0,0,0,.58)",
    color: "#fff",
    display: "flex",
    gap: 12,
    alignItems: "center",
    backdropFilter: "blur(20px)",
  },
  toastUrl: {
    margin: "2px 0 0",
    color: "#a1a1aa",
    fontSize: 12,
    maxWidth: 460,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  toastBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.09)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "none",
  },
  toastClose: {
    width: 26,
    height: 26,
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 12,
  },
  muted: {
    margin: 0,
    color: "#71717a",
    fontSize: 12,
    lineHeight: 1.45,
  },
  dot: {
    color: "#3f3f46",
  },
};