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
    <main style={{ minHeight: "100vh", background: "#08080c", color: "white", padding: 32 }}>
      <h1 style={{ fontSize: 52, marginBottom: 10 }}>Projects</h1>
      <p style={{ color: "#a1a1aa", marginBottom: 30 }}>All saved AI websites.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
        {projects?.map((p) => (
          <div key={p.id} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 20 }}>
            <h2>{p.name || "Untitled"}</h2>
            <p style={{ color: "#a1a1aa", minHeight: 70 }}>{p.idea}</p>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Link href={`/site/${p.slug}`} style={btn}>View</Link>
              <Link href={`/builder?idea=${encodeURIComponent(p.idea || "")}`} style={btn2}>Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const btn = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "white",
  color: "#09090b",
  textDecoration: "none",
  fontWeight: 900,
};

const btn2 = {
  ...btn,
  background: "rgba(255,255,255,.08)",
  color: "white",
};