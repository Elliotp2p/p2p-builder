import Link from "next/link";

const recentProjects = [
  "AI Receptionist",
  "Local Trainer Marketplace",
  "MealPlanPro",
  "Lead Finder AI",
];

const ideaCards = [
  {
    title: "AI SaaS landing page",
    text: "Build a premium SaaS page with pricing, features and CTA.",
  },
  {
    title: "Local business website",
    text: "Generate a modern site for dentists, gyms, cleaners or agencies.",
  },
  {
    title: "Marketplace startup",
    text: "Create a marketplace website with offer, trust and lead capture.",
  },
];

export default function Home() {
  return (
    <main style={app}>
      <aside style={sidebar}>
        <div style={sidebarTop}>
          <div style={brandMark}>P</div>
          <button style={collapseBtn}>◧</button>
        </div>

        <div style={workspace}>
          <div style={avatar}>E</div>
          <span>Elliot&apos;s P2P</span>
          <span style={{ marginLeft: "auto" }}>⌄</span>
        </div>

        <nav style={sideNav}>
          <Link href="/" style={sideActive}>
            ⌂ Home
          </Link>
          <Link href="/builder" style={sideLink}>
            ✦ Builder
          </Link>
          <Link href="/builder" style={sideLink}>
            ⌕ Projects
          </Link>
          <Link href="/builder" style={sideLink}>
            ⚙ Templates
          </Link>
        </nav>

        <div style={sideGroup}>
          <p style={sideLabel}>Projects</p>
          {recentProjects.map((project) => (
            <Link key={project} href="/builder" style={recentLink}>
              {project}
            </Link>
          ))}
        </div>

        <div style={upgradeCard}>
          <strong>Problem to Profit</strong>
          <p style={upgradeText}>AI websites, leads and startup pages.</p>
        </div>

        <div style={profileDot}>E</div>
      </aside>

      <section style={mainArea}>
        <div style={heroPanel}>
          <div style={heroGlow} />

          <div style={topPill}>🔥 Build full startup websites with AI →</div>

          <h1 style={heroTitle}>Let&apos;s build something, Elliot</h1>

          <div style={promptBox}>
            <textarea
              style={promptInput}
              placeholder="Ask P2P to generate a startup website..."
              defaultValue=""
            />

            <div style={promptBottom}>
              <Link href="/builder" style={plusBtn}>
                +
              </Link>

              <div style={promptActions}>
                <span style={buildMode}>Build ⌄</span>
                <Link href="/builder" style={sendBtn}>
                  ↑
                </Link>
              </div>
            </div>
          </div>

          <div style={floatingStats}>
            <div style={statCard}>
              <strong>100+</strong>
              <span>website ideas</span>
            </div>
            <div style={statCard}>
              <strong>Live</strong>
              <span>publish links</span>
            </div>
            <div style={statCard}>
              <strong>AI</strong>
              <span>edit + review</span>
            </div>
          </div>
        </div>

        <div style={projectsPanel}>
          <div style={tabs}>
            <button style={tabActive}>My projects</button>
            <button style={tab}>Recently viewed</button>
            <button style={tab}>Most visitors today</button>
            <button style={tab}>P2P templates</button>

            <Link href="/builder" style={browseAll}>
              Browse all →
            </Link>
          </div>

          <div style={cardGrid}>
            {ideaCards.map((card, index) => (
              <Link key={card.title} href="/builder" style={projectCard}>
                <div style={cardPreview(index)}>
                  <div style={miniBar} />
                  <div style={miniHero} />
                  <div style={miniLine} />
                  <div style={{ ...miniLine, width: "55%" }} />
                </div>

                <div style={cardBody}>
                  <strong>{card.title}</strong>
                  <p>{card.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const app: React.CSSProperties = {
  minHeight: "100vh",
  background: "#09090b",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  display: "grid",
  gridTemplateColumns: "270px 1fr",
  overflow: "hidden",
};

const sidebar: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080a",
  borderRight: "1px solid rgba(255,255,255,.08)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const sidebarTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "4px 6px",
};

const brandMark: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "linear-gradient(135deg,#fb7185,#8b5cf6,#22c55e)",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  color: "#fff",
};

const collapseBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontSize: 18,
};

const workspace: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  background: "#1c1c1f",
  border: "1px solid rgba(255,255,255,.08)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  fontSize: 14,
};

const avatar: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  background: "#6d28d9",
  display: "grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 900,
};

const sideNav: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const sideActive: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,.16)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 800,
};

const sideLink: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  color: "#e5e7eb",
  textDecoration: "none",
  fontWeight: 650,
};

const sideGroup: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gap: 10,
};

const sideLabel: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#a1a1aa",
  fontSize: 13,
};

const recentLink: React.CSSProperties = {
  color: "#e5e7eb",
  textDecoration: "none",
  fontSize: 14,
  padding: "2px 8px",
};

const upgradeCard: React.CSSProperties = {
  marginTop: "auto",
  padding: 14,
  borderRadius: 14,
  background: "#171717",
  border: "1px solid rgba(255,255,255,.08)",
};

const upgradeText: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#a1a1aa",
  fontSize: 12,
  lineHeight: 1.4,
};

const profileDot: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "#0ea5e9",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const mainArea: React.CSSProperties = {
  height: "100vh",
  overflowY: "auto",
  padding: 14,
};

const heroPanel: React.CSSProperties = {
  position: "relative",
  minHeight: 650,
  borderRadius: 18,
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at 50% 20%, rgba(31,41,55,.95), rgba(17,24,39,.7) 24%, transparent 42%), linear-gradient(135deg,#111827 0%,#2563eb 38%,#f472b6 68%,#fb2f3a 100%)",
};

const heroGlow: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at center, rgba(255,255,255,.12), transparent 32%)",
  pointerEvents: "none",
};

const topPill: React.CSSProperties = {
  position: "absolute",
  top: "36%",
  transform: "translateY(-90px)",
  padding: "10px 16px",
  borderRadius: 999,
  background: "rgba(15,23,42,.78)",
  border: "1px solid rgba(255,255,255,.12)",
  boxShadow: "0 18px 60px rgba(0,0,0,.25)",
  fontWeight: 850,
  fontSize: 14,
  zIndex: 2,
};

const heroTitle: React.CSSProperties = {
  position: "absolute",
  top: "36%",
  transform: "translateY(-25px)",
  fontSize: 34,
  margin: 0,
  zIndex: 2,
  textAlign: "center",
};

const promptBox: React.CSSProperties = {
  position: "relative",
  width: "min(700px, 90%)",
  minHeight: 112,
  marginTop: 60,
  borderRadius: 30,
  background: "#272723",
  border: "2px solid rgba(0,0,0,.65)",
  boxShadow: "0 35px 100px rgba(0,0,0,.35)",
  padding: 18,
  zIndex: 3,
};

const promptInput: React.CSSProperties = {
  width: "100%",
  height: 48,
  resize: "none",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#f4f4f5",
  fontSize: 18,
  fontFamily: "inherit",
};

const promptBottom: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const plusBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  color: "#d4d4d8",
  textDecoration: "none",
  display: "grid",
  placeItems: "center",
  fontSize: 26,
};

const promptActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const buildMode: React.CSSProperties = {
  color: "#e4e4e7",
  fontWeight: 700,
};

const sendBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#a1a1aa",
  color: "#18181b",
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontWeight: 950,
};

const floatingStats: React.CSSProperties = {
  position: "absolute",
  bottom: 36,
  display: "flex",
  gap: 12,
  zIndex: 4,
};

const statCard: React.CSSProperties = {
  minWidth: 120,
  padding: 14,
  borderRadius: 18,
  background: "rgba(8,8,10,.42)",
  border: "1px solid rgba(255,255,255,.12)",
  backdropFilter: "blur(14px)",
  display: "grid",
  gap: 3,
  textAlign: "center",
};

const projectsPanel: React.CSSProperties = {
  margin: "-70px auto 0",
  position: "relative",
  zIndex: 5,
  width: "min(1160px, 92%)",
  padding: 32,
  borderRadius: 26,
  background: "rgba(20,10,14,.92)",
  border: "1px solid rgba(255,255,255,.08)",
  boxShadow: "0 -20px 100px rgba(0,0,0,.25)",
};

const tabs: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const tabActive: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.16)",
  color: "#fff",
  fontWeight: 800,
};

const tab: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontWeight: 800,
};

const browseAll: React.CSSProperties = {
  marginLeft: "auto",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 800,
};

const cardGrid: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 20,
};

const projectCard: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: 18,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.08)",
  textDecoration: "none",
  color: "#fff",
};

const cardPreview = (index: number): React.CSSProperties => ({
  height: 160,
  padding: 18,
  background:
    index === 0
      ? "linear-gradient(135deg,#0f172a,#2563eb)"
      : index === 1
      ? "linear-gradient(135deg,#111827,#22c55e)"
      : "linear-gradient(135deg,#18181b,#f97316)",
});

const miniBar: React.CSSProperties = {
  width: "100%",
  height: 18,
  borderRadius: 999,
  background: "rgba(255,255,255,.22)",
  marginBottom: 20,
};

const miniHero: React.CSSProperties = {
  width: "72%",
  height: 42,
  borderRadius: 14,
  background: "rgba(255,255,255,.28)",
  marginBottom: 14,
};

const miniLine: React.CSSProperties = {
  width: "82%",
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,.22)",
  marginTop: 8,
};

const cardBody: React.CSSProperties = {
  padding: 18,
  display: "grid",
  gap: 8,
  color: "#d4d4d8",
};