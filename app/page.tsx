"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const categories = [
  "All",
  "AI",
  "Local Business",
  "Marketplace",
  "SaaS",
  "Mobile App",
  "B2B",
  "Consumer",
];

const niches = [
  "dentists",
  "personal trainers",
  "restaurants",
  "students",
  "real estate agents",
  "cleaning companies",
  "small gyms",
  "barbershops",
  "dog owners",
  "freelancers",
  "parents",
  "local shops",
];

const problems = Array.from({ length: 120 }).map((_, i) => {
  const niche = niches[i % niches.length];
  const category = categories[(i % (categories.length - 1)) + 1];

  const titles = [
    `AI booking assistant for ${niche}`,
    `Lead finder for ${niche}`,
    `Review collector for ${niche}`,
    `Simple CRM for ${niche}`,
    `Marketplace for ${niche}`,
    `Automation dashboard for ${niche}`,
    `Website builder for ${niche}`,
    `Client portal for ${niche}`,
  ];

  const title = titles[i % titles.length];

  return {
    id: i + 1,
    title,
    category,
    market: niche,
    pain: `${niche} waste time on repetitive tasks, missed leads, manual messages, bookings and follow-ups.`,
    website: `A premium website selling a simple product that helps ${niche} save time, get more customers and manage work faster.`,
    monetization:
      i % 3 === 0
        ? "Monthly subscription"
        : i % 3 === 1
        ? "Lead generation fees"
        : "Setup fee plus monthly support",
    prompt: `Build a premium ${category} startup website for: ${title}. The website should explain the problem, show the product, include trust sections, pricing, contact form and a strong CTA.`,
  };
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [customIdea, setCustomIdea] = useState("");
  const [selected, setSelected] = useState(problems[0]);
  const [showAll, setShowAll] = useState(false);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesFilter = filter === "All" || p.category === filter;
      const q = query.toLowerCase();

      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q) ||
        p.pain.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [query, filter]);

  const visibleProblems = showAll
    ? filteredProblems
    : filteredProblems.slice(0, 18);

  const customHref = customIdea.trim()
    ? `/builder?idea=${encodeURIComponent(customIdea.trim())}`
    : "/builder";

  return (
    <main style={app}>
      <aside style={sidebar}>
        <Link href="/" style={brandBlock}>
          <div style={logo}>P</div>
          <div>
            <strong>Problem to Profit</strong>
            <p style={mutedSmall}>AI website workspace</p>
          </div>
        </Link>

        <nav style={nav}>
          <a href="#workspace" style={navActive}>Workspace</a>
          <a href="#ideas" style={navLink}>Ideas</a>
          <Link href="/builder" style={navLink}>Builder</Link>
        </nav>

        <div style={sideCard}>
          <span style={miniBadge}>Status</span>
          <h3 style={{ margin: "10px 0 6px" }}>Ready to build</h3>
          <p style={muted}>
            Start from a prompt or choose a validated problem idea.
          </p>
        </div>
      </aside>

      <section style={mainArea}>
        <header style={topbar}>
          <div>
            <p style={eyebrow}>Problem to Profit AI</p>
            <h1 style={title}>
              A clean workspace for turning ideas into websites.
            </h1>
          </div>

          <Link href="/builder" style={topCta}>
            Open Builder
          </Link>
        </header>

        <section id="workspace" style={workspaceGrid}>
          <div style={promptPanel}>
            <span style={miniBadge}>Start from scratch</span>
            <h2 style={panelTitle}>Describe what you want to build</h2>
            <p style={muted}>
              Write one sentence. The AI chooses the layout, style, sections,
              images and conversion flow.
            </p>

            <textarea
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Ex: Luxury Nordic travel website for Gothenburg with cinematic harbor photography"
              style={promptInput}
            />

            <Link href={customHref} style={primaryButton}>
              Generate website
            </Link>
          </div>

          <div style={statsPanel}>
            <div style={statCard}>
              <strong>120+</strong>
              <span>Problem ideas</span>
            </div>
            <div style={statCard}>
              <strong>4</strong>
              <span>Core pages</span>
            </div>
            <div style={statCard}>
              <strong>AI</strong>
              <span>Design engine</span>
            </div>
          </div>
        </section>

        <section id="ideas" style={ideasPanel}>
          <div style={panelHeader}>
            <div>
              <span style={miniBadge}>Opportunity library</span>
              <h2 style={{ margin: "10px 0 4px" }}>Browse startup ideas</h2>
              <p style={muted}>
                Pick a problem. Preview the business angle. Generate the site.
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ideas..."
              style={search}
            />
          </div>

          <div style={filters}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={filter === c ? filterActive : filterBtn}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={contentGrid}>
            <div style={ideaList}>
              {visibleProblems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={selected.id === p.id ? ideaActive : ideaCard}
                >
                  <div style={ideaTop}>
                    <span style={badge}>{p.category}</span>
                    <span style={ideaId}>#{p.id}</span>
                  </div>

                  <strong>{p.title}</strong>
                  <p>{p.pain}</p>
                </button>
              ))}

              {!showAll && filteredProblems.length > 18 && (
                <button onClick={() => setShowAll(true)} style={showMore}>
                  Show all {filteredProblems.length} ideas
                </button>
              )}
            </div>

            <aside style={details}>
              <span style={badgeLarge}>{selected.category}</span>
              <h2 style={detailTitle}>{selected.title}</h2>

              <div style={detailBlock}>
                <span>Problem</span>
                <p>{selected.pain}</p>
              </div>

              <div style={detailBlock}>
                <span>Website angle</span>
                <p>{selected.website}</p>
              </div>

              <div style={detailBlock}>
                <span>Monetization</span>
                <p>{selected.monetization}</p>
              </div>

              <Link
                href={`/builder?idea=${encodeURIComponent(selected.prompt)}`}
                style={primaryButton}
              >
                Build this website
              </Link>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}

const app: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080c",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  display: "grid",
  gridTemplateColumns: "280px 1fr",
};

const sidebar: React.CSSProperties = {
  padding: 18,
  borderRight: "1px solid rgba(255,255,255,.08)",
  background: "#06060a",
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const brandBlock: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  color: "#fff",
  textDecoration: "none",
};

const logo: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
};

const nav: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const navLink: React.CSSProperties = {
  padding: "12px 14px",
  color: "#a1a1aa",
  textDecoration: "none",
  fontWeight: 750,
  borderRadius: 12,
};

const navActive: React.CSSProperties = {
  ...navLink,
  color: "#fff",
  background: "rgba(255,255,255,.07)",
};

const sideCard: React.CSSProperties = {
  marginTop: "auto",
  padding: 18,
  borderRadius: 20,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(255,255,255,.08)",
};

const mainArea: React.CSSProperties = {
  padding: 26,
  overflowY: "auto",
};

const topbar: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 24,
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  color: "#c4b5fd",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  fontWeight: 900,
};

const title: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 0.95,
  letterSpacing: "-.07em",
  maxWidth: 760,
  margin: "10px 0 0",
};

const topCta: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 999,
  background: "#fff",
  color: "#09090b",
  textDecoration: "none",
  fontWeight: 900,
};

const workspaceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr .8fr",
  gap: 18,
  marginBottom: 22,
};

const promptPanel: React.CSSProperties = {
  padding: 28,
  borderRadius: 28,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",
  border: "1px solid rgba(255,255,255,.09)",
  boxShadow: "0 30px 100px rgba(0,0,0,.32)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1.05,
  letterSpacing: "-.04em",
  margin: "12px 0 8px",
};

const promptInput: React.CSSProperties = {
  width: "100%",
  height: 116,
  marginTop: 18,
  padding: 16,
  borderRadius: 20,
  border: "1px solid rgba(167,139,250,.28)",
  background: "rgba(0,0,0,.28)",
  color: "#fff",
  outline: "none",
  resize: "none",
  fontSize: 15,
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  marginTop: 16,
  display: "inline-flex",
  justifyContent: "center",
  padding: "13px 18px",
  borderRadius: 999,
  background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const statsPanel: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const statCard: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(255,255,255,.08)",
};

const ideasPanel: React.CSSProperties = {
  padding: 24,
  borderRadius: 28,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(255,255,255,.08)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
};

const search: React.CSSProperties = {
  width: 300,
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.045)",
  color: "#fff",
  outline: "none",
};

const filters: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 20,
};

const filterBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.09)",
  background: "rgba(255,255,255,.035)",
  color: "#a1a1aa",
  cursor: "pointer",
};

const filterActive: React.CSSProperties = {
  ...filterBtn,
  background: "rgba(167,139,250,.16)",
  color: "#fff",
};

const contentGrid: React.CSSProperties = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "1.35fr .82fr",
  gap: 20,
};

const ideaList: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
  maxHeight: 620,
  overflowY: "auto",
};

const ideaCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.07)",
  background: "rgba(255,255,255,.035)",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const ideaActive: React.CSSProperties = {
  ...ideaCard,
  border: "1px solid rgba(167,139,250,.45)",
  background: "rgba(167,139,250,.1)",
};

const ideaTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const badge: React.CSSProperties = {
  fontSize: 11,
  color: "#c4b5fd",
  fontWeight: 900,
};

const ideaId: React.CSSProperties = {
  color: "#71717a",
  fontSize: 11,
};

const details: React.CSSProperties = {
  position: "sticky",
  top: 20,
  alignSelf: "start",
  padding: 22,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,.1)",
  background:
    "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",
};

const badgeLarge: React.CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  fontSize: 13,
};

const detailTitle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.05,
  letterSpacing: "-.04em",
};

const detailBlock: React.CSSProperties = {
  marginTop: 18,
};

const muted: React.CSSProperties = {
  color: "#a1a1aa",
  lineHeight: 1.6,
  margin: 0,
};

const mutedSmall: React.CSSProperties = {
  color: "#71717a",
  fontSize: 12,
  margin: "3px 0 0",
};

const miniBadge: React.CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.2,
};

const showMore: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};