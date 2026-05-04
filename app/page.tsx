import Link from "next/link";

export default function Home() {
  return (
    <main style={app}>
      {/* NAV */}
      <nav style={nav}>
        <div style={logo}>P2P</div>

        <div style={navRight}>
          <Link href="/builder" style={ctaSmall}>
            Start building
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={hero}>
        <div style={heroContent}>
          <p style={tag}>AI WEBSITE BUILDER</p>

          <h1 style={title}>
            Turn random problems into
            <span style={gradient}> real startups.</span>
          </h1>

          <p style={subtitle}>
            Describe a problem. Our AI builds a full startup website, lets you
            edit it with chat, and publishes it instantly.
          </p>

          <div style={heroActions}>
            <Link href="/builder" style={ctaPrimary}>
              Start building free
            </Link>

            <span style={secondaryText}>No signup required</span>
          </div>
        </div>

        <div style={heroPreview}>
          <div style={previewCard}>
            <div style={previewTop}>
              <div style={dot} />
              <div style={dot} />
              <div style={dot} />
            </div>

            <div style={previewBody}>
              <p style={{ color: "#22c55e", fontWeight: 700 }}>
                AI is building...
              </p>

              {[
                "Analyzing problem",
                "Creating startup idea",
                "Designing layout",
                "Writing conversion copy",
                "Publishing live site",
              ].map((step, i) => (
                <div key={i} style={stepItem}>
                  {i + 1}. {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={features}>
        {[
          ["Chat-based builder", "Edit your website like chatting with ChatGPT."],
          ["Live preview", "See your startup website update instantly."],
          ["Publish instantly", "Get a live link in seconds."],
        ].map(([title, text]) => (
          <div key={title} style={featureCard}>
            <h3>{title}</h3>
            <p style={featureText}>{text}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={ctaSection}>
        <h2 style={ctaTitle}>Build your first startup in 30 seconds</h2>
        <Link href="/builder" style={ctaPrimary}>
          Start now
        </Link>
      </section>
    </main>
  );
}

/* === STYLES === */

const app: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(34,197,94,.2), transparent 30%), #020617",
  color: "#fff",
  fontFamily: "Inter, system-ui",
  padding: 28,
};

const nav: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: 1200,
  margin: "0 auto",
};

const logo: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
};

const navRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
};

const ctaSmall: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 800,
  textDecoration: "none",
};

const hero: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 40,
  alignItems: "center",
  padding: "80px 0",
};

const heroContent: React.CSSProperties = {};

const tag: React.CSSProperties = {
  color: "#86efac",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 1.5,
};

const title: React.CSSProperties = {
  fontSize: 70,
  lineHeight: 1,
  margin: "16px 0",
};

const gradient: React.CSSProperties = {
  background: "linear-gradient(90deg,#22c55e,#4ade80)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const subtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 20,
  lineHeight: 1.6,
  maxWidth: 600,
};

const heroActions: React.CSSProperties = {
  marginTop: 30,
  display: "flex",
  gap: 20,
  alignItems: "center",
};

const ctaPrimary: React.CSSProperties = {
  padding: "16px 24px",
  borderRadius: 999,
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 900,
  textDecoration: "none",
};

const secondaryText: React.CSSProperties = {
  color: "#64748b",
};

const heroPreview: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

const previewCard: React.CSSProperties = {
  width: 400,
  borderRadius: 24,
  background: "#020617",
  border: "1px solid rgba(255,255,255,.1)",
  overflow: "hidden",
};

const previewTop: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: 12,
};

const dot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#475569",
};

const previewBody: React.CSSProperties = {
  padding: 20,
};

const stepItem: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,.05)",
};

const features: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 20,
};

const featureCard: React.CSSProperties = {
  padding: 24,
  borderRadius: 20,
  background: "rgba(255,255,255,.05)",
};

const featureText: React.CSSProperties = {
  color: "#94a3b8",
};

const ctaSection: React.CSSProperties = {
  marginTop: 100,
  textAlign: "center",
};

const ctaTitle: React.CSSProperties = {
  fontSize: 40,
  marginBottom: 20,
};