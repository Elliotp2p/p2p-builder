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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe || !previewHtml) return;

    const injectEditor = () => {
      const doc =
        iframe.contentDocument || iframe.contentWindow?.document;

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

    return () =>
      window.removeEventListener("resize", updateScale);
  }, []);

  const readStream = async (res: Response) => {
    const reader = res.body?.getReader();

    if (!reader) {
      throw new Error("No stream reader");
    }

    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split("\n\n");

      buffer = events.pop() || "";

      for (const event of events) {
        const line = event
          .split("\n")
          .find((l) => l.startsWith("data: "));

        if (!line) continue;

        const payload = JSON.parse(
          line.replace("data: ", "")
        );

        if (payload.type === "status") {
          setStatus(payload.text);

          setMessages((m) => [
            ...m,
            {
              role: "ai",
              text: payload.text,
            },
          ]);
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
              text:
                payload.text ||
                "Something went wrong.",
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

    const { error } =
      await supabase.auth.signInWithOAuth({
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const res = await fetch("/api/sites", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    setProjects(data.sites || []);
  };

  const loadLeads = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const res = await fetch("/api/leads", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

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
    const params = new URLSearchParams(
      window.location.search
    );

    const id = params.get("id");

    if (!id) return;

    setStarted(true);

    fetch(`/api/site?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.site) {
          const loadedFiles =
            data.site.html_files || {
              "index.html": data.site.html,
            };

          setFiles(loadedFiles);

          setActiveFile("index.html");

          setProblem(data.site.problem || "");

          setTemplate(
            data.site.template || templates[0]
          );

          setStatus("Project loaded");

          setMessages([
            {
              role: "ai",
              text:
                "Project loaded. I can edit the full multi-page site with context.",
            },
          ]);
        }
      });
  }, []);

  const addUser = (text: string) => {
    setMessages((m) => [
      ...m,
      {
        role: "user",
        text,
      },
    ]);
  };

  const runBuild = async (
    customProblem?: string
  ) => {
    const finalProblem =
      customProblem || problem || chatInput;

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
          "Content-Type":
            "application/json",
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
          text:
            "Network error. Try again with a shorter prompt.",
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
          "Content-Type":
            "application/json",
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
          text:
            "Network error while editing.",
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

    setMessages((m) => [
      ...m,
      {
        role: "ai",
        text:
          "Publishing the multi-page site and creating a live link...",
      },
    ]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setStatus("Publish error");

        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text:
              "Publish error: You are not logged in.",
          },
        ]);

        return;
      }

      const res = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${session.access_token}`,
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

        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text:
              "Publish error: " +
              (data.error ||
                "Unknown error"),
          },
        ]);

        return;
      }

      const fullUrl =
        window.location.origin + data.url;

      setLink(fullUrl);

      setStatus("Published");

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "Published. Your multi-page live link is ready.",
        },
      ]);

      loadProjects();
      loadLeads();
    } catch (e: any) {
      setStatus("Publish error");

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "Publish error: " +
            (e.message ||
              "Unknown error"),
        },
      ]);
    }
  };