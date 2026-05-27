import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ProjectsPage() {
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,slug,idea,created_at")
    .order("created_at", { ascending: false });

  return (
    <main style={page}>
      <div style={hero}>
        <div>
          <p style={eyebrow}>Problem to Profit</p>
          <h1 style={title}>Your AI startup workspace</h1>
          <p style={subtitle}>
            Continue building, editing and deploying your AI-generated products.
          </p>
        </div>

        <Link href="/builder" style={newButton}>
          + New Project
        </Link>
      </div>

      <div style={topbar}>
        <input placeholder="Search projects..." style={search} />

        <div style={stats}>
          <div style={statCard}>
            <strong>{projects?.length || 0}</strong>
            <span>Projects</span>
          </div>

          <div style={statCard}>
            <strong>AI</strong>
            <span>Builder</span>
          </div>

          <div style={statCard}>
            <strong>Live</strong>
            <span>Deploys</span>
          </div>
        </div>
      </div>

      {!projects?.length ? (
        <div style={emptyState}>
          <h2>No projects yet</h2>

          <p style={{ color: "#a1a1aa" }}>
            Generate your first AI website to get started.
          </p>

          <Link href="/builder" style={emptyBtn}>
            Open Builder
          </Link>
        </div>
      ) : (
        <div style={grid}>
          {projects.map((p) => (
            <div key={p.id} style={card}>
              <div style={preview}>
                <div style={fakeBrowser}>
                  <div style={browserTop}>
                    <div style={browserDots}>
                      <span style={dotRed} />
                      <span style={dotYellow} />
                      <span style={dotGreen} />
                    </div>

                    <div style={browserBar}>{p.slug || "project"}</div>
                  </div>

                  <div style={browserContent}>
                    <div style={miniSidebar} />

                    <div style={miniMain}>
                      <div style={miniHero} />

                      <div style={miniCards}>
                        <div style={miniCard} />
                        <div style={miniCard} />
                        <div style={miniCard} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={previewGlow} />
                <span style={previewBadge}>AI WEBSITE</span>
              </div>

              <div style={content}>
                <div style={topRow}>
                  <div>
                    <h2 style={name}>{p.name || "Untitled"}</h2>

                    <p style={date}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={liveDot} />
                </div>

                <p style={idea}>{p.idea}</p>

                <div style={buttons}>
                  <Link href={`/site/${p.slug}`} style={primaryBtn}>
                    Open
                  </Link>

                  <Link
                   href={`/builder?project=${p.id}`}
                    style={secondaryBtn}
                  >
                    Continue Editing
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#06070b",
  color: "white",
  padding: 32,
  fontFamily: "Inter, system-ui, Arial",
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 30,
};

const eyebrow: React.CSSProperties = {
  color: "#a78bfa",
  textTransform: "uppercase",
  letterSpacing: 1.5,
  fontWeight: 900,
  fontSize: 12,
  margin: 0,
};

const title: React.CSSProperties = {
  fontSize: 62,
  lineHeight: 0.95,
  letterSpacing: "-.06em",
  margin: "10px 0",
  maxWidth: 720,
};

const subtitle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 18,
  maxWidth: 640,
};

const newButton: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: 999,
  background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const topbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 30,
};

const search: React.CSSProperties = {
  width: 320,
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.05)",
  color: "white",
  outline: "none",
};

const stats: React.CSSProperties = {
  display: "flex",
  gap: 12,
};

const statCard: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 18,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.08)",
  display: "grid",
  gap: 4,
};

const emptyState: React.CSSProperties = {
  marginTop: 120,
  textAlign: "center",
};

const emptyBtn: React.CSSProperties = {
  display: "inline-flex",
  marginTop: 20,
  padding: "14px 18px",
  borderRadius: 999,
  background: "white",
  color: "#09090b",
  textDecoration: "none",
  fontWeight: 900,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
  gap: 20,
};

const card: React.CSSProperties = {
  borderRadius: 30,
  overflow: "hidden",
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.08)",
  boxShadow: "0 30px 80px rgba(0,0,0,.35)",
};

const preview: React.CSSProperties = {
  height: 220,
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg,#0f172a,#1e1b4b,#312e81,#7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fakeBrowser: React.CSSProperties = {
  width: "88%",
  height: 170,
  borderRadius: 18,
  overflow: "hidden",
  background: "#0b1020",
  border: "1px solid rgba(255,255,255,.08)",
  boxShadow: "0 30px 80px rgba(0,0,0,.45)",
  position: "relative",
  zIndex: 2,
};

const browserTop: React.CSSProperties = {
  height: 38,
  background: "rgba(255,255,255,.05)",
  borderBottom: "1px solid rgba(255,255,255,.06)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "0 14px",
};

const browserDots: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const dotRed: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#ef4444",
};

const dotYellow: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#f59e0b",
};

const dotGreen: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#22c55e",
};

const browserBar: React.CSSProperties = {
  flex: 1,
  height: 24,
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  display: "flex",
  alignItems: "center",
  paddingLeft: 12,
  color: "#71717a",
  fontSize: 12,
};

const browserContent: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px 1fr",
  height: "calc(100% - 38px)",
};

const miniSidebar: React.CSSProperties = {
  borderRight: "1px solid rgba(255,255,255,.05)",
  background: "rgba(255,255,255,.03)",
};

const miniMain: React.CSSProperties = {
  padding: 12,
};

const miniHero: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
};

const miniCards: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 10,
  marginTop: 12,
};

const miniCard: React.CSSProperties = {
  height: 52,
  borderRadius: 12,
  background: "rgba(255,255,255,.06)",
};

const previewGlow: React.CSSProperties = {
  position: "absolute",
  width: 300,
  height: 300,
  borderRadius: "50%",
  background: "rgba(255,255,255,.15)",
  filter: "blur(80px)",
  top: -120,
  right: -80,
};

const previewBadge: React.CSSProperties = {
  position: "absolute",
  top: 18,
  left: 18,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,.14)",
  backdropFilter: "blur(10px)",
  fontSize: 12,
  fontWeight: 900,
  zIndex: 3,
};

const content: React.CSSProperties = {
  padding: 22,
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const name: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  letterSpacing: "-.04em",
};

const date: React.CSSProperties = {
  color: "#71717a",
  fontSize: 13,
  marginTop: 6,
};

const liveDot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#22c55e",
  marginTop: 8,
};

const idea: React.CSSProperties = {
  color: "#a1a1aa",
  lineHeight: 1.7,
  marginTop: 18,
  minHeight: 90,
};

const buttons: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 24,
};

const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: "13px 16px",
  borderRadius: 14,
  background: "white",
  color: "#09090b",
  textDecoration: "none",
  fontWeight: 900,
  textAlign: "center",
};

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  padding: "13px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.08)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  textAlign: "center",
};