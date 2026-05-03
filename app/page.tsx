"use client";

import { useEffect, useState } from "react";

const problems = [
  "Folk hatar att tvätta",
  "Ingen vet vad de ska äta",
  "Svårt att hitta kunder online",
];

type SavedProject = {
  id: string;
  name: string;
  problem: string;
  html: string;
  createdAt: string;
};

export default function Page() {
  const [selectedProblem, setSelectedProblem] = useState("");
  const [loading, setLoading] = useState(false);

  const [style, setStyle] = useState("");
  const [audience, setAudience] = useState("");

  const [steps, setSteps] = useState<string[]>([]);
  const [files, setFiles] = useState<any>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  const green = "#22c55e";

  useEffect(() => {
    const saved = localStorage.getItem("p2p_projects");
    if (saved) setSavedProjects(JSON.parse(saved));
  }, []);

  const saveToStorage = (projects: SavedProject[]) => {
    localStorage.setItem("p2p_projects", JSON.stringify(projects));
    setSavedProjects(projects);
  };

  const showSteps = (newSteps: string[]) => {
    setSteps([]);
    let i = 0;

    const interval = setInterval(() => {
      if (i < newSteps.length) {
        setSteps((prev) => [...prev, newSteps[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 500);
  };

  const generateWebsite = async (problem: string) => {
    setSelectedProblem(problem);
    setLoading(true);
    setPreviewOpen(true);
    setSteps([]);
    setFiles({});
    setMessages([]);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ problem, style, audience }),
    });

    const data = await res.json();

    showSteps(data.steps || []);
    setFiles(data.files || {});
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    if (!files["index.html"]) return alert("Generera först");

    const instruction = chatInput;
    setChatInput("");
    setMessages((prev) => [...prev, "Du: " + instruction]);
    setLoading(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problem: selectedProblem,
        editWebsite: true,
        currentHtml: files["index.html"],
        instruction,
      }),
    });

    const data = await res.json();

    showSteps(data.steps || []);
    setFiles(data.files || {});
    setMessages((prev) => [...prev, "AI: Uppdaterat"]);
    setLoading(false);
  };

  const saveProject = () => {
    if (!files["index.html"]) return alert("Ingen sida");

    const project: SavedProject = {
      id: crypto.randomUUID(),
      name: selectedProblem || "Projekt",
      problem: selectedProblem,
      html: files["index.html"],
      createdAt: new Date().toLocaleString(),
    };

    saveToStorage([project, ...savedProjects]);
    alert("Sparat");
  };

  const exportHTML = () => {
    if (!files["index.html"]) return alert("Ingen sida");

    const blob = new Blob([files["index.html"]], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: previewOpen ? "50% 50%" : "100%",
        background: "#020617",
        color: "#fff",
        fontFamily: "Arial",
      }}
    >
      <section style={{ padding: 30, overflowY: "auto" }}>
        <h1>Problem → Profit AI</h1>

        <input
          placeholder="Stil"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Målgrupp"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: 20 }}>
          {problems.map((p) => (
            <button
              key={p}
              onClick={() => generateWebsite(p)}
              style={{
                ...problemButton,
                background: selectedProblem === p ? green : "#111",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {files["index.html"] && (
          <>
            <button onClick={saveProject} style={saveButton}>
              💾 Spara
            </button>

            <button onClick={exportHTML} style={saveButton}>
              ⬇️ Ladda ner kod
            </button>
          </>
        )}
      </section>

      {previewOpen && (
        <section
          style={{
            background: "#0f172a",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ color: "#86efac" }}>
            {loading && "AI jobbar..."}
            {steps.map((s, i) => (
              <div key={i}>• {s}</div>
            ))}
          </div>

          <div style={{ flex: 1, background: "#fff" }}>
            {files["index.html"] && (
              <iframe
                srcDoc={files["index.html"]}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            )}
          </div>

          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ändra..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 999,
              border: "none",
            }}
          />

          <button onClick={sendChat} style={chatButton}>
            Skicka
          </button>
        </section>
      )}
    </main>
  );
}

const inputStyle = {
  padding: 10,
  width: "100%",
  marginTop: 10,
  borderRadius: 8,
  border: "none",
};

const problemButton = {
  display: "block",
  marginBottom: 10,
  padding: 14,
  borderRadius: 999,
  border: "none",
  color: "#fff",
  width: "100%",
  textAlign: "left" as const,
};

const saveButton = {
  marginTop: 10,
  padding: 14,
  borderRadius: 999,
  border: "none",
  background: "#22c55e",
  color: "#fff",
  width: "100%",
};

const chatButton = {
  padding: 12,
  borderRadius: 999,
  border: "none",
  background: "#22c55e",
  color: "#fff",
  width: "100%",
};