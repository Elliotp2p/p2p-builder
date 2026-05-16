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
    pain: `${niche} often waste time on repetitive tasks, missed leads, manual messages, bookings and follow-ups.`,
    website: `A premium website selling a simple product that helps ${niche} save time, get more customers and manage work faster.`,
    monetization:
      i % 3 === 0
        ? "Monthly subscription"
        : i % 3 === 1
        ? "Lead generation fees"
        : "One-time setup plus monthly support",
    prompt: `Build a premium ${category} startup website for: ${title}. The website should explain the problem, show the product, include trust sections, pricing, contact form and a strong CTA.`,
  };
});

export default function Home() {
  const [activeView, setActiveView] = useState("ideas");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [customIdea, setCustomIdea] = useState("");
  const [selected, setSelected] = useState(problems[0]);

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

  const customHref = customIdea.trim()
    ? `/builder?idea=${encodeURIComponent(customIdea.trim())}`
    : "/builder";

  return (
    <main style={app}>
      <aside style={sidebar}>
        <button onClick={() => setActiveView("ideas")} style={logoBox}>
          <div style={logo}>P</div>
          <h2 style={sideTitle}>Problem to Profit</h2>
          <p style={sideText}>Find problems. Build websites. Launch fast.</p>
        </button>

        <Link href="/builder" style={workspace}>
          <div style={avatar}>E</div>
          <span>Elliot&apos;s P2P</span>
          <span style={{ marginLeft: "auto" }}>Builder</span>
        </Link>

        <nav style={nav}>
          <button
            onClick={() => setActiveView("ideas")}
            style={activeView === "ideas" ? navActive : navButton}
          >
            Problem ideas
          </button>

          <button
            onClick={() => setActiveView("custom")}
            style={activeView === "custom" ? navActive : navButton}
          >
            Build custom idea
          </button>

          <Link href="/builder" style={navLink}>
            Builder
          </Link>
        </nav>

        <div style={upgrade}>
          <strong>Opportunity engine</strong>
          <p style={sideText}>
            Browse startup problems and generate a website from any idea.
          </p>
        </div>
      </aside>

      <section style={mainArea}>
        <section style={hero}>
          <div style={glowBlue} />
          <div style={glowPink} />

          <div style={pill}>AI startup problem finder</div>

          <h1 style={title}>
            Find a problem. <span style={titleGradient}>Build the website.</span>
          </h1>

          <p style={subtitle}>
            Browse 100+ curated problems inspired by real online complaints,
            business gaps and startup opportunities.
          </p>

          <div style={promptBox}>
            <input
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Or write your own website idea..."
              style={promptInput}
            />

            <Link href={customHref} style={generateSmall}>
              Generate website
            </Link>
          </div>
        </section>

        <section style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={{ margin: 0 }}>Problem opportunities</h2>
              <p style={muted}>
                Select a problem to see what the website should sell.
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems..."
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
              {filteredProblems.map((p) => (
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
            </div>

            <aside style={details}>
              <span style={badgeLarge}>{selected.category}</span>

              <h2 style={detailTitle}>{selected.title}</h2>

              <div style={detailBlock}>
                <span>Problem</span>
                <p>{selected.pain}</p>
              </div>

              <div style={detailBlock}>
                <span>Website idea</span>
                <p>{selected.website}</p>
              </div>

              <div style={detailBlock}>
                <span>How it can make money</span>
                <p>{selected.monetization}</p>
              </div>

              <Link
                href={`/builder?idea=${encodeURIComponent(selected.prompt)}`}
                style={generateBtn}
              >
                Generate website
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
  background: "#050509",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  display: "grid",
  gridTemplateColumns: "290px 1fr",
};

const sidebar: React.CSSProperties = {
  padding: 16,
  borderRight: "1px solid rgba(255,255,255,.08)",
  background: "rgba(5,5,9,.96)",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const logoBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,.1)",
  background:
    "linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const logo: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "linear-gradient(135deg,#2563eb,#a855f7,#ec4899)",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  marginBottom: 14,
};

const sideTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const sideText: React.CSSProperties = {
  color: "#a1a1aa",
  lineHeight: 1.55,
  margin: "8px 0 0",
};

const workspace: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.08)",
  color: "#fff",
  textDecoration: "none",
};

const avatar: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  background: "linear-gradient(135deg,#2563eb,#ec4899)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const nav: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const navActive: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background:
    "linear-gradient(90deg,rgba(59,130,246,.18),rgba(168,85,247,.14))",
  color: "#fff",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.08)",
  textAlign: "left",
  cursor: "pointer",
};

const navButton: React.CSSProperties = {
  padding: "14px 16px",
  color: "#e5e7eb",
  background: "transparent",
  border: "none",
  textAlign: "left",
  fontWeight: 750,
  cursor: "pointer",
};

const navLink: React.CSSProperties = {
  padding: "14px 16px",
  color: "#e5e7eb",
  textDecoration: "none",
  fontWeight: 750,
};

const upgrade: React.CSSProperties = {
  marginTop: "auto",
  padding: 18,
  borderRadius: 18,
  background:
    "linear-gradient(135deg,rgba(37,99,235,.2),rgba(236,72,153,.2))",
  border: "1px solid rgba(255,255,255,.12)",
};

const mainArea: React.CSSProperties = {
  padding: 16,
  overflowY: "auto",
};

const hero: React.CSSProperties = {
  position: "relative",
  minHeight: 520,
  borderRadius: 24,
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  background:
    "radial-gradient(circle at 25% 55%, rgba(37,99,235,.75), transparent 32%), radial-gradient(circle at 75% 35%, rgba(236,72,153,.75), transparent 34%), linear-gradient(135deg,#06111f,#111827 35%,#831843 100%)",
};

const glowBlue: React.CSSProperties = {
  position: "absolute",
  width: 500,
  height: 500,
  left: 140,
  top: 220,
  background: "#2563eb",
  filter: "blur(120px)",
  opacity: 0.55,
};

const glowPink: React.CSSProperties = {
  position: "absolute",
  width: 520,
  height: 520,
  right: 100,
  top: 120,
  background: "#ec4899",
  filter: "blur(120px)",
  opacity: 0.6,
};

const pill: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  padding: "12px 18px",
  borderRadius: 999,
  background: "rgba(8,13,30,.7)",
  border: "1px solid rgba(255,255,255,.14)",
  fontWeight: 900,
};

const title: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  fontSize: 58,
  lineHeight: 1.05,
  margin: "18px 0 0",
};

const titleGradient: React.CSSProperties = {
  background: "linear-gradient(90deg,#60a5fa,#c084fc,#f472b6)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const subtitle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  color: "#d4d4d8",
  fontSize: 18,
  maxWidth: 760,
  lineHeight: 1.6,
};

const promptBox: React.CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "min(780px, 82%)",
  borderRadius: 28,
  padding: 18,
  background: "rgba(10,10,16,.72)",
  border: "1px solid rgba(96,165,250,.8)",
  boxShadow:
    "0 0 0 1px rgba(236,72,153,.45), 0 35px 120px rgba(0,0,0,.45)",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
};

const promptInput: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#fff",
  fontSize: 18,
};

const generateSmall: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 999,
  background: "linear-gradient(90deg,#2563eb,#ec4899)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const panel: React.CSSProperties = {
  width: "min(1180px, 94%)",
  margin: "60px auto 60px",
  position: "relative",
  zIndex: 5,
  padding: 28,
  borderRadius: 28,
  background: "rgba(8,8,14,.82)",
  border: "1px solid rgba(255,255,255,.12)",
  boxShadow: "0 -30px 100px rgba(0,0,0,.35)",
  backdropFilter: "blur(18px)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
};

const muted: React.CSSProperties = {
  color: "#a1a1aa",
  marginBottom: 0,
};

const search: React.CSSProperties = {
  width: 320,
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  outline: "none",
};

const filters: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 22,
};

const filterBtn: React.CSSProperties = {
  padding: "10px 13px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.04)",
  color: "#d4d4d8",
  cursor: "pointer",
};

const filterActive: React.CSSProperties = {
  ...filterBtn,
  background: "rgba(236,72,153,.16)",
  color: "#fff",
};

const contentGrid: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gridTemplateColumns: "1.35fr .8fr",
  gap: 22,
};

const ideaList: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 14,
  maxHeight: 620,
  overflowY: "auto",
  paddingRight: 4,
};

const ideaCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const ideaActive: React.CSSProperties = {
  ...ideaCard,
  border: "1px solid rgba(236,72,153,.45)",
  background: "rgba(236,72,153,.11)",
};

const ideaTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const badge: React.CSSProperties = {
  fontSize: 11,
  color: "#f9a8d4",
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
  border: "1px solid rgba(255,255,255,.12)",
  background:
    "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))",
};

const badgeLarge: React.CSSProperties = {
  color: "#f9a8d4",
  fontWeight: 900,
  fontSize: 13,
};

const detailTitle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.05,
};

const detailBlock: React.CSSProperties = {
  marginTop: 18,
};

const generateBtn: React.CSSProperties = {
  marginTop: 24,
  display: "block",
  textAlign: "center",
  padding: 15,
  borderRadius: 999,
  background: "linear-gradient(90deg,#2563eb,#a855f7,#ec4899)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 950,
};